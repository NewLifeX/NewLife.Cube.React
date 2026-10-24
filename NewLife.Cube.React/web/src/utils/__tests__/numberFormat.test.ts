/**
 * 字段值格式化单元测试（percent / money / decimal(p,s) / TimeSpan / Time / GMK）
 */
import { describe, expect, it } from 'vitest';
import {
  formatDateTimeWithPattern,
  formatDecimal,
  formatGmk,
  formatMoney,
  formatPercent,
  formatTimeSpan,
  formatTimeStamp,
  parseDecimalScale,
  resolvePercentDivisor,
} from '@/utils/numberFormat';

describe('formatPercent', () => {
  it('比例值转百分比：未声明 scale 时 0 位小数（对齐后端 p{scale-2}）', () => {
    expect(formatPercent(0.12)).toBe('12%');
    expect(formatPercent(0.125)).toBe('13%');
  });

  it('scale 含百分号两位：scale=4 → 两位小数，scale=3 → 一位', () => {
    expect(formatPercent(0.12345, { scale: 4 })).toBe('12.35%');
    expect(formatPercent(0.1234, { scale: 3 })).toBe('12.3%');
  });

  it('描述声明缩放词时先除再转百分比', () => {
    // 万分之一：值 1200 表示 12%（0 位小数）
    expect(formatPercent(1200, { description: '万分之一' })).toBe('12%');
    expect(resolvePercentDivisor('1/1000')).toBe(1000);
  });

  it('空值与非数字原样处理', () => {
    expect(formatPercent(null)).toBe('');
    expect(formatPercent(undefined)).toBe('');
    expect(formatPercent('abc')).toBe('abc');
  });
});

describe('formatMoney', () => {
  it('千分位 + 2 位小数', () => {
    expect(formatMoney(1234567.891)).toBe('1,234,567.89');
    expect(formatMoney(0)).toBe('0.00');
  });

  it('空值返回空串', () => {
    expect(formatMoney(null)).toBe('');
    expect(formatMoney('')).toBe('');
  });
});

describe('formatDecimal', () => {
  it('按小数位补零，不加千分位', () => {
    expect(formatDecimal(1234.5, 2)).toBe('1234.50');
    expect(formatDecimal(5, 0)).toBe('5');
  });

  it('空值返回空串', () => {
    expect(formatDecimal(undefined)).toBe('');
  });
});

describe('parseDecimalScale', () => {
  it('从 decimal(p,s) 解析小数位', () => {
    expect(parseDecimalScale('decimal(18,2)')).toBe(2);
    expect(parseDecimalScale('Decimal(10, 4)')).toBe(4);
  });

  it('不声明时优先用字段 scale，再回退 2', () => {
    expect(parseDecimalScale('decimal', 3)).toBe(3);
    expect(parseDecimalScale(undefined)).toBe(2);
  });
});

describe('formatTimeSpan（ITYPE-3）', () => {
  it('默认格式对齐 .NET TimeSpan：不足一天不显示天数', () => {
    expect(formatTimeSpan(3725)).toBe('01:02:05');
    expect(formatTimeSpan(90061)).toBe('1.01:01:01');
    expect(formatTimeSpan(0)).toBe('00:00:00');
    expect(formatTimeSpan(-65)).toBe('-00:01:05');
  });

  it('按描述单位换算：毫秒 / 分 / 小时', () => {
    expect(formatTimeSpan(1500, { description: '耗时（毫秒）' })).toBe('00:00:01.5');
    expect(formatTimeSpan(2, { description: '时长（小时）' })).toBe('02:00:00');
    expect(formatTimeSpan(90, { description: '时长（分钟）' })).toBe('01:30:00');
  });

  it('TimeSpan:<格式> 自定义格式', () => {
    expect(formatTimeSpan(3725, { itemType: "TimeSpan:d'.'hh':'mm':'ss" })).toBe('0.01:02:05');
    expect(formatTimeSpan(3725, { itemType: 'TimeSpan:hh:mm' })).toBe('01:02');
  });

  it('空值返回空串', () => {
    expect(formatTimeSpan(null)).toBe('');
    expect(formatTimeSpan('')).toBe('');
  });
});

describe('formatTimeStamp（ITYPE-4）', () => {
  it('Unix 秒转本地时间，默认到秒', () => {
    const seconds = new Date(2026, 0, 2, 3, 4, 5).getTime() / 1000;
    expect(formatTimeStamp(seconds)).toBe('2026-01-02 03:04:05');
  });

  it('Time:<格式> 自定义格式', () => {
    const seconds = new Date(2026, 0, 2, 3, 4, 5).getTime() / 1000;
    expect(formatTimeStamp(seconds, { itemType: 'Time:yyyy/MM/dd' })).toBe('2026/01/02');
  });

  it('非法值返回空串', () => {
    expect(formatTimeStamp(0)).toBe('');
    expect(formatTimeStamp('abc')).toBe('abc');
  });
});

describe('formatDateTimeWithPattern（ITYPE-5）', () => {
  it('按 .NET 格式串输出（含中文 token 与字面量）', () => {
    expect(formatDateTimeWithPattern('2026-01-02T03:04:05', 'yyyy年MM月dd日')).toBe('2026年01月02日');
    expect(formatDateTimeWithPattern('2026-01-02 03:04:05', 'yyyy/MM/dd HH:mm')).toBe('2026/01/02 03:04');
  });

  it('无法解析时原样返回', () => {
    expect(formatDateTimeWithPattern('not-a-date', 'yyyy')).toBe('not-a-date');
  });
});

describe('formatGmk（ITYPE-6）', () => {
  it('1024 进制，不足 1K 用千分位整数', () => {
    expect(formatGmk(1023)).toBe('1,023');
    expect(formatGmk(1024)).toBe('1.00K');
    expect(formatGmk(1536)).toBe('1.50K');
    expect(formatGmk(1024 * 1024 * 3.45)).toBe('3.45M');
  });

  it('负数与空值', () => {
    expect(formatGmk(-2048)).toBe('-2.00K');
    expect(formatGmk(null)).toBe('');
  });
});
