/**
 * 时长换算（ItemType=TimeSpan）
 *
 * 口径与魔方其余皮肤（Vue/NaiveUI/ArcoVue/TDesign/Vuetify/MUI/Shadcn/Svelte/Angular）一致：
 * - 字段值仍是整数（或小数），单位由字段描述推断：毫秒/ms → 毫秒，小时/hour → 小时，分/minute → 分钟，否则秒；
 * - 表单编辑为「时 : 分 : 秒」，小时不限位数，分/秒 0~59，毫秒单位的秒保留 3 位小数；
 * - 列表格式化（`TimeSpan` 列）与本模块共用同一份换算，避免「列表 6 小时、编辑按秒」的漂移。
 *
 * 注：`@newlifex/cube` 的下一版会内置同名助手（`timeSpanUnitOfDescription`/`splitTimeSpan`/`joinTimeSpan`），
 * 届时本模块可改为再导出，保持调用点不变。
 */

/** 时长存储单位 */
export type TimeSpanUnit = 'milliseconds' | 'seconds' | 'minutes' | 'hours';

/** 时长分段（时/分/秒）。毫秒单位下秒可带 3 位小数 */
export interface TimeSpanParts {
  hours: number;
  minutes: number;
  seconds: number;
}

/** 各存储单位相对秒的换算系数（1 存储单位 = factor 秒） */
const UNIT_SECONDS: Record<TimeSpanUnit, number> = {
  milliseconds: 0.001,
  seconds: 1,
  minutes: 60,
  hours: 3600,
};

/** 数值归一：非法值按 0 处理，保留正负号（列表可显示负时长） */
function toFinite(value: unknown): number {
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
}

/** 非负数值归一：非法值或负值按 0 处理（输入框不接受负时长） */
function toNonNegative(value: unknown): number {
  const n = toFinite(value);
  return n > 0 ? n : 0;
}

/**
 * 从字段描述推断存储单位（顺序：毫秒/ms → 小时 → 分 → 默认秒）。
 *
 * @param description 字段描述，如「累计在线总时间，单位秒」
 * @returns 存储单位
 * @example timeSpanUnitOfDescription('耗时，单位毫秒') // 'milliseconds'
 */
export function timeSpanUnitOfDescription(description?: string): TimeSpanUnit {
  const text = (description ?? '').toLowerCase();
  if (/毫秒|ms|millisecond/.test(text)) return 'milliseconds';
  if (/小时|hour/.test(text)) return 'hours';
  if (/分|minute/.test(text)) return 'minutes';
  return 'seconds';
}

/**
 * 时长存储值 → 秒（保留负号，供列表格式化使用）。
 *
 * @param value 存储值
 * @param unit 存储单位
 * @returns 总秒数
 */
export function timeSpanToSeconds(value: unknown, unit: TimeSpanUnit): number {
  return toFinite(value) * UNIT_SECONDS[unit];
}

/**
 * 秒 → 时长存储值，按存储单位的整数语义四舍五入。
 *
 * @param seconds 总秒数
 * @param unit 存储单位
 * @returns 存储值
 */
export function secondsToTimeSpan(seconds: number, unit: TimeSpanUnit): number {
  return Math.round(toFinite(seconds) / UNIT_SECONDS[unit]);
}

/**
 * 时长存储值 → 时/分/秒分段（供输入组件回显）。负值按 0 处理。
 *
 * @param value 存储值
 * @param unit 存储单位
 * @returns 时/分/秒分段
 * @example splitTimeSpan(22515, 'seconds') // { hours: 6, minutes: 15, seconds: 15 }
 */
export function splitTimeSpan(value: unknown, unit: TimeSpanUnit): TimeSpanParts {
  const total = Math.max(0, timeSpanToSeconds(value, unit));
  let hours = Math.floor(total / 3600);
  let minutes = Math.floor((total % 3600) / 60);
  const factor = unit === 'milliseconds' ? 1000 : 1;
  let seconds = Math.round((total % 60) * factor) / factor;

  // 毫秒单位下 59.9996 会四舍五入成 60.000，需进位，避免出现「秒 = 60」这种非法分段
  if (seconds >= 60) {
    seconds = 0;
    minutes += 1;
  }
  if (minutes >= 60) {
    minutes = 0;
    hours += 1;
  }

  return { hours, minutes, seconds };
}

/**
 * 时/分/秒分段 → 时长存储值。各段非法或负数按 0 处理。
 *
 * @param parts 时/分/秒分段
 * @param unit 存储单位
 * @returns 存储值
 */
export function joinTimeSpan(parts: TimeSpanParts, unit: TimeSpanUnit): number {
  const hours = Math.floor(toNonNegative(parts.hours));
  const minutes = Math.floor(toNonNegative(parts.minutes));
  const seconds = toNonNegative(parts.seconds);

  return secondsToTimeSpan(hours * 3600 + minutes * 60 + seconds, unit);
}
