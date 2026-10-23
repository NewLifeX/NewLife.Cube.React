/**
 * 数值格式化（META-7：ItemType percent / money / decimal(p,s)）
 *
 * 对齐后端 `ViewHelper.AppendPercentCell` 与列表视图 n2 约定：
 * - `percent`：值按描述中的缩放词（万分之一/千分之一/百分之一/十分之一 或 1/10000 …）
 *   先除再加百分号，小数位取 `scale - 2`；
 * - `money`：千分位 + 2 位小数（不加货币符号，避免假设币种）；
 * - `decimal(p,s)`：按小数位 s 补零，不加千分位。
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
  // 后端约定：scale 含百分号两位（p{scale-2}），未声明 scale 时固定两位
  const digits = scale >= 2 ? scale - 2 : 2;
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
