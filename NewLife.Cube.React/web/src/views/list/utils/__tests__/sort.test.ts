/**
 * 列表初始排序单测
 */
import { describe, expect, it } from 'vitest';
import { resolveInitialSort } from '../sort';

describe('resolveInitialSort', () => {
  it('OrderByKey 开启时按主键降序', () => {
    expect(resolveInitialSort(true, 'Id')).toEqual({ field: 'Id', desc: true });
  });

  it('OrderByKey 关闭时不发送排序', () => {
    expect(resolveInitialSort(false, 'Id')).toBeUndefined();
    expect(resolveInitialSort(undefined, 'Id')).toBeUndefined();
  });

  it('缺少主键字段时不发送排序', () => {
    expect(resolveInitialSort(true, '')).toBeUndefined();
    expect(resolveInitialSort(true, undefined)).toBeUndefined();
  });
});
