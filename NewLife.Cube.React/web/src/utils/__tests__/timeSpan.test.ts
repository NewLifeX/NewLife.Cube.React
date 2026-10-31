/**
 * 时长换算单元测试（ItemType=TimeSpan，口径与共享包 @newlifex/cube 一致）
 */
import { describe, expect, it } from 'vitest';
import {
  joinTimeSpan,
  secondsToTimeSpan,
  splitTimeSpan,
  timeSpanToSeconds,
  timeSpanUnitOfDescription,
} from '@/utils/timeSpan';

describe('timeSpanUnitOfDescription', () => {
  it('按描述推断存储单位', () => {
    expect(timeSpanUnitOfDescription('累计在线总时间，单位秒')).toBe('seconds');
    expect(timeSpanUnitOfDescription('耗时，单位毫秒')).toBe('milliseconds');
    expect(timeSpanUnitOfDescription('Timeout in milliseconds')).toBe('milliseconds');
    expect(timeSpanUnitOfDescription('时长，单位分钟')).toBe('minutes');
    expect(timeSpanUnitOfDescription('Duration in hour')).toBe('hours');
  });

  it('描述缺失或无线索时默认秒', () => {
    expect(timeSpanUnitOfDescription(undefined)).toBe('seconds');
    expect(timeSpanUnitOfDescription('')).toBe('seconds');
    expect(timeSpanUnitOfDescription('累计时长')).toBe('seconds');
  });
});

describe('timeSpanToSeconds / secondsToTimeSpan', () => {
  it('按单位换算并保留负号', () => {
    expect(timeSpanToSeconds(22515, 'seconds')).toBe(22515);
    expect(timeSpanToSeconds(1500, 'milliseconds')).toBe(1.5);
    expect(timeSpanToSeconds(90, 'minutes')).toBe(5400);
    expect(timeSpanToSeconds(2, 'hours')).toBe(7200);
    expect(timeSpanToSeconds(-60, 'seconds')).toBe(-60);
    expect(timeSpanToSeconds('abc', 'seconds')).toBe(0);
  });

  it('回写按存储单位取整', () => {
    expect(secondsToTimeSpan(90, 'minutes')).toBe(2);
    expect(secondsToTimeSpan(5400, 'hours')).toBe(2);
    expect(secondsToTimeSpan(1500, 'milliseconds')).toBe(1500000);
  });
});

describe('splitTimeSpan / joinTimeSpan', () => {
  it('拆成时/分/秒', () => {
    expect(splitTimeSpan(22515, 'seconds')).toEqual({ hours: 6, minutes: 15, seconds: 15 });
    expect(splitTimeSpan(0, 'seconds')).toEqual({ hours: 0, minutes: 0, seconds: 0 });
    expect(splitTimeSpan(null, 'seconds')).toEqual({ hours: 0, minutes: 0, seconds: 0 });
    expect(splitTimeSpan(-90, 'seconds')).toEqual({ hours: 0, minutes: 0, seconds: 0 });
  });

  it('支持超过 24 小时', () => {
    expect(splitTimeSpan(90061, 'seconds')).toEqual({ hours: 25, minutes: 1, seconds: 1 });
  });

  it('毫秒单位秒保留 3 位小数，四舍五入到 60 时进位', () => {
    expect(splitTimeSpan(1500, 'milliseconds')).toEqual({ hours: 0, minutes: 0, seconds: 1.5 });
    expect(splitTimeSpan(59999.6, 'milliseconds')).toEqual({ hours: 0, minutes: 1, seconds: 0 });
    expect(splitTimeSpan(3599999.6, 'milliseconds')).toEqual({ hours: 1, minutes: 0, seconds: 0 });
  });

  it('分段与合成互为逆运算', () => {
    for (const total of [0, 59, 60, 3599, 3600, 22515, 90061]) {
      expect(joinTimeSpan(splitTimeSpan(total, 'seconds'), 'seconds')).toBe(total);
    }
    expect(joinTimeSpan({ hours: 1, minutes: 30, seconds: 0 }, 'minutes')).toBe(90);
    expect(joinTimeSpan({ hours: -1, minutes: 0, seconds: 0 }, 'seconds')).toBe(0);
  });
});
