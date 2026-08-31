/**
 * 视图解析诊断页单测：行数据转换 + 默认值
 */
import { describe, expect, it } from 'vitest';
import { buildRows, DEFAULT_VALUES, type ViewTraceResult } from '../ViewTracePage';

describe('视图解析诊断页', () => {
  it('默认值对齐 MVC（视图 Index）', () => {
    expect(DEFAULT_VALUES).toEqual({ area: '', controller: '', view: 'Index', theme: '' });
  });

  it('buildRows 标记优先级/物理存在/命中', () => {
    const result: ViewTraceResult = {
      candidates: ['/Areas/Cube/Views/User/Index.cshtml', '/Areas/Cube/Views/Shared/Index.cshtml'],
      physical: [true, false],
      hit: '/Areas/Cube/Views/User/Index.cshtml',
      hitIndex: 0,
    };
    const rows = buildRows(result);
    expect(rows).toEqual([
      { key: 0, priority: 1, path: '/Areas/Cube/Views/User/Index.cshtml', physical: true, hit: true },
      { key: 1, priority: 2, path: '/Areas/Cube/Views/Shared/Index.cshtml', physical: false, hit: false },
    ]);
  });

  it('buildRows 未命中时 hit 全 false', () => {
    const result: ViewTraceResult = {
      candidates: ['/A.cshtml', '/B.cshtml'],
      physical: [false, false],
      hit: null,
      hitIndex: -1,
    };
    const rows = buildRows(result);
    expect(rows.every((r) => !r.hit)).toBe(true);
  });

  it('buildRows 空/缺省安全', () => {
    expect(buildRows(null)).toEqual([]);
    expect(buildRows({})).toEqual([]);
  });
});
