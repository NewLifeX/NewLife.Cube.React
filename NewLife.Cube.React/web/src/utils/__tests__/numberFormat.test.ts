/**
 * 数值格式化单元测试（META-7：percent / money / decimal(p,s)）
 */
import { describe, expect, it } from 'vitest';
import {
  formatDecimal,
  formatMoney,
  formatPercent,
  parseDecimalScale,
  resolvePercentDivisor,
} from '@/utils/numberFormat';

describe('formatPercent', () => {
  it('比例值转百分比：小数位默认两位', () => {
    expect(formatPercent(0.125)).toBe('12.50%');
  });

  it('scale 含百分号两位：scale=4 → 两位小数，scale=3 → 一位', () => {
    expect(formatPercent(0.12345, { scale: 4 })).toBe('12.35%');
    expect(formatPercent(0.1234, { scale: 3 })).toBe('12.3%');
  });

  it('描述声明缩放词时先除再转百分比', () => {
    // 万分之一：值 1250 表示 12.5%
    expect(formatPercent(1250, { description: '万分之一' })).toBe('12.50%');
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
