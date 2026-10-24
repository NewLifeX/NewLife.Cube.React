/**
 * 字段值展示格式化（ItemType percent / money / decimal(p,s) / TimeSpan / Time / GMK）
 *
 * 对齐后端 `ViewHelper.AppendPercentCell`、`ViewHelper.FormatValue` 与 MVC 列表视图约定：
 * - `percent`：值按描述中的缩放词（万分之一/千分之一/百分之一/十分之一 或 1/10000 …）
 *   先除再加百分号，小数位取 `scale - 2`（未声明 scale 时为 0 位，与后端 `p{scale-2}` 同口径）；
 * - `money`：千分位 + 2 位小数（不加货币符号，避免假设币种）；
 * - `decimal(p,s)`：按小数位 s 补零，不加千分位；
 * - `TimeSpan`/`TimeSpan:<格式>`：值按描述单位（毫秒/分/小时，缺省秒）换算后套格式；
 * - `Time`/`Time:<格式>`：值视为 Unix 秒，转本地时间；
 * - `GMK`：1024 进制容量（对齐 `ToGMK`）。
 */
import type { FieldMeta } from '@/types/field';

/** 千分位 + 固定小数位 */
function withThousands(value: number, digits: number): string {
  return value.toLocaleString('zh-CN', {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  });
}

/**
 * 解析百分比字段的缩放除数（同后端 ViewHelper.GetPercentDivisor）
 *
 * @param description 字段描述（如「万分之一」或英文 1/1000）
 * @returns 除数；未命中缩放词时返回 1
 */
export function resolvePercentDivisor(description?: string): number {
  if (!description) return 1;
  // 长串优先匹配，避免 1/10 误命中 1/1000
  if (description.includes('万分之一') || description.includes('1/10000')) return 10000;
  if (description.includes('千分之一') || description.includes('1/1000')) return 1000;
  if (description.includes('百分之一') || description.includes('1/100')) return 100;
  if (description.includes('十分之一') || description.includes('1/10')) return 10;
  return 1;
}

/**
 * 百分比格式化（值 = 比例，如 0.125 → 12.50%）
 *
 * @param value 原始值
 * @param field 字段元数据（取 scale 与 description 推断精度与缩放）
 * @returns 百分比文本；空值返回空串
 */
export function formatPercent(value: unknown, field?: Pick<FieldMeta, 'scale' | 'description'>): string {
  if (value === null || value === undefined || value === '') return '';
  const num = Number(value);
  if (!Number.isFinite(num)) return String(value);

  const divisor = resolvePercentDivisor(field?.description);
  const scale = field?.scale ?? 0;
  // 后端约定：scale 含百分号两位（p{scale-2}），未声明 scale 时取 0 位
  const digits = scale >= 2 ? scale - 2 : 0;
  return `${withThousands((num / divisor) * 100, digits)}%`;
}

/**
 * 金额格式化（千分位 + 2 位小数）
 *
 * @param value 原始值
 * @returns 金额文本；空值返回空串
 */
export function formatMoney(value: unknown): string {
  if (value === null || value === undefined || value === '') return '';
  const num = Number(value);
  if (!Number.isFinite(num)) return String(value);
  return withThousands(num, 2);
}

/**
 * 定点小数格式化（`decimal(p,s)` 的 s 位小数，不加千分位）
 *
 * @param value 原始值
 * @param scale 小数位；缺省 2
 * @returns 小数文本；空值返回空串
 */
export function formatDecimal(value: unknown, scale = 2): string {
  if (value === null || value === undefined || value === '') return '';
  const num = Number(value);
  if (!Number.isFinite(num)) return String(value);
  const digits = Math.min(Math.max(scale, 0), 8);
  return num.toFixed(digits);
}

/**
 * 解析 `decimal(p,s)` 声明的小数位
 *
 * @param itemType 后端 ItemType（decimal / decimal(18,2)）
 * @param fallback 未声明时回退值（一般取字段 scale）
 * @returns 小数位
 */
export function parseDecimalScale(itemType: string | undefined, fallback?: number): number {
  const m = /^decimal\(\s*\d+\s*,\s*(\d+)\s*\)$/i.exec((itemType ?? '').trim());
  if (m) return Number(m[1]);
  return fallback ?? 2;
}

/**
 * .NET 日期格式串转文本（支持 yyyy/yy/MM/M/dd/d/HH/H/hh/h/mm/m/ss/s/fff/f/tt 与引号字面量）
 *
 * 后端 ItemType 形如 `time-yyyy年MM月dd日`、`Time:yyyy/MM/dd`，只覆盖常用 token，未知字符原样输出。
 *
 * @param date 日期对象
 * @param format .NET 风格格式串
 * @returns 格式化文本；格式为空或日期非法时返回空串
 */
export function formatDotNetDate(date: Date, format: string): string {
  if (!format) return '';
  if (Number.isNaN(date.getTime())) return '';

  const pad = (value: number, width = 2) => String(value).padStart(width, '0');
  const hours = date.getHours();
  const tokens: Array<[string, string]> = [
    ['yyyy', String(date.getFullYear())],
    ['yy', String(date.getFullYear()).slice(-2)],
    ['MM', pad(date.getMonth() + 1)],
    ['M', String(date.getMonth() + 1)],
    ['dd', pad(date.getDate())],
    ['d', String(date.getDate())],
    ['HH', pad(hours)],
    ['H', String(hours)],
    ['hh', pad(hours % 12 || 12)],
    ['h', String(hours % 12 || 12)],
    ['mm', pad(date.getMinutes())],
    ['m', String(date.getMinutes())],
    ['ss', pad(date.getSeconds())],
    ['s', String(date.getSeconds())],
    ['fff', pad(date.getMilliseconds(), 3)],
    ['f', String(Math.floor(date.getMilliseconds() / 100))],
    ['tt', hours < 12 ? 'AM' : 'PM'],
  ];

  let result = '';
  let index = 0;
  while (index < format.length) {
    const ch = format[index];
    // 引号内为字面量，原样输出
    if (ch === "'" || ch === '"') {
      const end = format.indexOf(ch, index + 1);
      if (end < 0) {
        result += format.slice(index + 1);
        break;
      }
      result += format.slice(index + 1, end);
      index = end + 1;
      continue;
    }
    const hit = tokens.find(([token]) => format.startsWith(token, index));
    if (hit) {
      result += hit[1];
      index += hit[0].length;
      continue;
    }
    result += ch;
    index += 1;
  }
  return result;
}

/** .NET TimeSpan 默认格式：`[-][d.]hh:mm:ss[.fff]` */
function formatTimeSpanDefault(totalSeconds: number): string {
  const negative = totalSeconds < 0;
  const abs = Math.abs(totalSeconds);
  const days = Math.floor(abs / 86400);
  const hours = Math.floor((abs % 86400) / 3600);
  const minutes = Math.floor((abs % 3600) / 60);
  const seconds = Math.floor(abs % 60);
  const fraction = Math.round((abs - Math.floor(abs)) * 1000);
  const pad = (value: number) => String(value).padStart(2, '0');

  let text =
    days > 0
      ? `${days}.${pad(hours)}:${pad(minutes)}:${pad(seconds)}`
      : `${pad(hours)}:${pad(minutes)}:${pad(seconds)}`;
  if (fraction > 0) text += `.${String(fraction).padStart(3, '0').replace(/0+$/, '')}`;
  return negative ? `-${text}` : text;
}

/** .NET TimeSpan 自定义格式（支持 d/dd/h/hh/m/mm/s/ss/f/ff/fff 与引号字面量） */
function formatTimeSpanCustom(totalSeconds: number, format: string): string {
  const negative = totalSeconds < 0;
  const abs = Math.abs(totalSeconds);
  const days = Math.floor(abs / 86400);
  const hours = Math.floor((abs % 86400) / 3600);
  const minutes = Math.floor((abs % 3600) / 60);
  const seconds = Math.floor(abs % 60);
  const milliseconds = Math.round((abs - Math.floor(abs)) * 1000);
  const pad = (value: number, width = 2) => String(value).padStart(width, '0');

  const tokens: Array<[string, string]> = [
    ['dd', pad(days)],
    ['d', String(days)],
    ['hh', pad(hours)],
    ['h', String(hours)],
    ['mm', pad(minutes)],
    ['m', String(minutes)],
    ['ss', pad(seconds)],
    ['s', String(seconds)],
    ['fff', pad(milliseconds, 3)],
    ['ff', pad(Math.floor(milliseconds / 10), 2)],
    ['f', String(Math.floor(milliseconds / 100))],
  ];

  let result = '';
  let index = 0;
  while (index < format.length) {
    const ch = format[index];
    if (ch === "'" || ch === '"') {
      const end = format.indexOf(ch, index + 1);
      if (end < 0) {
        result += format.slice(index + 1);
        break;
      }
      result += format.slice(index + 1, end);
      index = end + 1;
      continue;
    }
    if (ch === '\\' && index + 1 < format.length) {
      result += format[index + 1];
      index += 2;
      continue;
    }
    const hit = tokens.find(([token]) => format.startsWith(token, index));
    if (hit) {
      result += hit[1];
      index += hit[0].length;
      continue;
    }
    result += ch;
    index += 1;
  }
  return negative ? `-${result}` : result;
}

/**
 * 时长格式化（ItemType=`TimeSpan` / `TimeSpan:<格式>`，ITYPE-3）
 *
 * 对齐后端 `ViewHelper.FormatValue`：先按字段描述里的单位（毫秒/分/小时，缺省秒）换算成秒，
 * 再套默认格式或声明的自定义格式。
 *
 * @param value 原始值（秒/毫秒/分/小时数）
 * @param field 字段元数据（取 description 判单位、itemType 取格式串）
 * @returns 时长文本；空值返回空串
 */
export function formatTimeSpan(
  value: unknown,
  field?: Pick<FieldMeta, 'description' | 'itemType'>,
): string {
  if (value === null || value === undefined || value === '') return '';
  const num = Number(value);
  if (!Number.isFinite(num)) return String(value);

  const description = (field?.description ?? '').toLowerCase();
  let totalSeconds = num;
  if (/毫秒|ms|millisecond/.test(description)) totalSeconds = num / 1000;
  else if (/小时|hour/.test(description)) totalSeconds = num * 3600;
  else if (/分|minute/.test(description)) totalSeconds = num * 60;

  const itemType = (field?.itemType ?? '').trim();
  const colon = itemType.indexOf(':');
  if (colon > 0) {
    const format = itemType.slice(colon + 1).trim();
    if (format) return formatTimeSpanCustom(totalSeconds, format);
  }
  return formatTimeSpanDefault(totalSeconds);
}

/**
 * Unix 秒时间戳格式化（ItemType=`Time` / `Time:<格式>`，ITYPE-4）
 *
 * 对齐后端 `ViewHelper.FormatValue`：值按 Unix 秒解析为本地时间。
 *
 * @param value 原始值（Unix 秒）
 * @param field 字段元数据（取 itemType 的格式串）
 * @returns 时间文本；非法或超出范围返回空串
 */
export function formatTimeStamp(
  value: unknown,
  field?: Pick<FieldMeta, 'itemType'>,
): string {
  if (value === null || value === undefined || value === '') return '';
  const seconds = Number(value);
  if (!Number.isFinite(seconds)) return String(value);
  // 0 / 负数视为「未填」（后端 ToDateTime(0) 得 MinValue，Year<=1 时输出空）
  if (seconds <= 0) return '';

  const date = new Date(seconds * 1000);
  if (Number.isNaN(date.getTime()) || date.getFullYear() <= 1) return '';

  const itemType = (field?.itemType ?? '').trim();
  const colon = itemType.indexOf(':');
  if (colon > 0) {
    const format = itemType.slice(colon + 1).trim();
    if (format) return formatDotNetDate(date, format);
  }
  // 后端 ToFullString 默认带毫秒；列表展示到秒即可
  return formatDotNetDate(date, 'yyyy-MM-dd HH:mm:ss');
}

/**
 * 日期时间按自定义格式输出（ItemType=`time-<格式>`，ITYPE-5）
 *
 * @param value 原始值（ISO 字符串 / 时间戳）
 * @param pattern .NET 风格格式串
 * @returns 格式化文本；无法解析时原样返回
 */
export function formatDateTimeWithPattern(value: unknown, pattern: string): string {
  if (value === null || value === undefined || value === '') return '';
  const text = String(value);
  const date = new Date(text.includes('T') ? text : text.replace(' ', 'T'));
  if (Number.isNaN(date.getTime())) return text;
  return formatDotNetDate(date, pattern);
}

/**
 * 容量格式化（ItemType=`GMK`，ITYPE-6）
 *
 * 对齐后端 `ToGMK`：1024 进制，不足 1K 输出千分位整数，其余保留两位小数加单位。
 *
 * @param value 原始值（字节数）
 * @returns 容量文本（如 `1,234` / `1.21K` / `3.45M`）；空值返回空串
 */
export function formatGmk(value: unknown): string {
  if (value === null || value === undefined || value === '') return '';
  const num = Number(value);
  if (!Number.isFinite(num)) return String(value);
  if (num < 0) return `-${formatGmk(-num)}`;
  if (num < 1024) return withThousands(Math.trunc(num), 0);

  const units = ['K', 'M', 'G', 'T', 'P', 'E', 'Z', 'Y'];
  let size = num / 1024;
  for (const unit of units) {
    if (size < 1024 || unit === 'Y') return `${withThousands(size, 2)}${unit}`;
    size /= 1024;
  }
  return String(num);
}
