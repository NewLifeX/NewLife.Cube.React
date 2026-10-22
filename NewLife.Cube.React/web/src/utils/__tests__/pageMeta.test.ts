/**
 * isEntityMeta 单元测试
 *
 * 覆盖：
 * - 实体页 meta 含 list 数组 → true
 * - 配置页/ObjectController meta 只有 setting+editForm → false
 * - 旧后端 SPA 回退的 HTML 字符串、空响应 → false
 */
import { describe, expect, it } from 'vitest';
import type { ApiResponse, PageMeta } from '@newlifex/api-core';
import { isEntityMeta } from '../pageMeta';

/** 构造 ApiResponse<PageMeta> */
function makeMeta(data: PageMeta): ApiResponse<PageMeta> {
  return { code: 0, data } as ApiResponse<PageMeta>;
}

describe('isEntityMeta 页面元数据形态判定', () => {
  it('实体页 meta 含 list 数组 → 实体页', () => {
    expect(isEntityMeta(makeMeta({ setting: {}, list: [], allList: [], addForm: [], search: [] }))).toBe(true);
  });

  it('配置页 meta 只有 setting 与 editForm → 非实体页', () => {
    expect(isEntityMeta(makeMeta({ setting: {}, editForm: [] }))).toBe(false);
  });

  it('旧后端回退的 HTML 字符串 → 非实体页', () => {
    expect(isEntityMeta('<!doctype html><html></html>')).toBe(false);
    expect(isEntityMeta({ code: 0, data: '<html></html>' } as unknown as ApiResponse<PageMeta>)).toBe(false);
  });

  it('空响应 → 非实体页', () => {
    expect(isEntityMeta(null)).toBe(false);
    expect(isEntityMeta(undefined)).toBe(false);
    expect(isEntityMeta({ code: 0 } as ApiResponse<PageMeta>)).toBe(false);
  });
});
