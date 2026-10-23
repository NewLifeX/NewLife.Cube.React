/**
 * LovSelect 级联过滤单元测试（FORM-10 parentField）
 *
 * 后端枚举子字典的选项带 parent；父字段有值时按 parent 过滤，无 parent 信息的选项保留。
 */
import { describe, expect, it } from 'vitest';
import { filterLovOptions } from '../LovSelect';
import type { LovOption } from '@/hooks/useLovOptions';

const options: LovOption[] = [
  { value: '1', label: '工单A', parent: '板块甲' },
  { value: '2', label: '工单B', parent: '板块乙' },
  { value: '3', label: '普通选项', parent: null },
];

describe('filterLovOptions', () => {
  it('无父值时不过滤', () => {
    expect(filterLovOptions(options)).toHaveLength(3);
    expect(filterLovOptions(options, '')).toHaveLength(3);
    expect(filterLovOptions(options, null)).toHaveLength(3);
  });

  it('有父值时保留匹配项与无 parent 信息的选项', () => {
    const out = filterLovOptions(options, '板块甲');
    expect(out.map((o) => o.value)).toEqual(['1', '3']);
  });

  it('父值为数字时按字符串比较', () => {
    const numeric: LovOption[] = [
      { value: 'a', label: 'A', parent: '7' },
      { value: 'b', label: 'B', parent: '8' },
    ];
    expect(filterLovOptions(numeric, 7).map((o) => o.value)).toEqual(['a']);
  });
});
