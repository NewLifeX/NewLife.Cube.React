/**
 * 列偏好单元测试（LIST-13）
 *
 * 契约：`/meta.list` 全量列 + `visible:false` 默认隐藏；用户勾选/排序存 localStorage，
 * 用户偏好覆盖 `visible=false`；未参与过配置的新字段沿用元数据默认值。
 */
import { beforeEach, describe, expect, it } from 'vitest';
import type { FieldMapping } from '@newlifex/field-mapping';
import {
  applyColumnPrefs,
  clearColumnPrefs,
  columnPrefsKey,
  loadColumnPrefs,
  saveColumnPrefs,
} from '../columnPrefs';

/** 构造字段 */
function mk(name: string, visible?: boolean): FieldMapping {
  return {
    widget: 'text',
    field: { name, displayName: name, typeName: 'String', ...(visible !== undefined ? { visible } : {}) },
  } as unknown as FieldMapping;
}

/** 字段名序列 */
function names(fields: FieldMapping[]): string[] {
  return fields.map((f) => f.field.name);
}

describe('columnPrefs 存储', () => {
  beforeEach(() => localStorage.clear());

  it('键按页面路径小写分桶', () => {
    expect(columnPrefsKey('/Admin/User')).toBe('cube-columns:/admin/user');
    expect(columnPrefsKey('')).toBe('cube-columns:/');
  });

  it('保存→读取→清除', () => {
    saveColumnPrefs('/Admin/User', { order: ['Name', 'Id'], hidden: ['Remark'] });
    expect(loadColumnPrefs('/Admin/User')).toEqual({ order: ['Name', 'Id'], hidden: ['Remark'] });

    clearColumnPrefs('/Admin/User');
    expect(loadColumnPrefs('/Admin/User')).toBeNull();
  });

  it('损坏数据返回 null 不抛异常', () => {
    localStorage.setItem(columnPrefsKey('/X'), '{bad json');
    expect(loadColumnPrefs('/X')).toBeNull();
  });
});

describe('applyColumnPrefs', () => {
  const fields = [mk('Id'), mk('Name'), mk('Remark', false), mk('CreateTime')];

  it('无偏好时原样返回', () => {
    expect(applyColumnPrefs(fields, null)).toBe(fields);
  });

  it('按用户列序重排，未列出的字段保持原序排在后面', () => {
    const out = applyColumnPrefs(fields, { order: ['Name', 'Id'], hidden: [] });
    expect(names(out)).toEqual(['Name', 'Id', 'Remark', 'CreateTime']);
  });

  it('用户隐藏的列标记 visible=false', () => {
    const out = applyColumnPrefs(fields, { order: ['Id', 'Name', 'Remark', 'CreateTime'], hidden: ['Remark'] });
    expect(out.find((f) => f.field.name === 'Remark')!.field.visible).toBe(false);
  });

  it('浏览器偏好覆盖 meta 的 visible=false（勾选即显示）', () => {
    const out = applyColumnPrefs(fields, { order: ['Id', 'Name', 'Remark', 'CreateTime'], hidden: [] });
    expect(out.find((f) => f.field.name === 'Remark')!.field.visible).toBe(true);
  });

  it('未参与过配置的新字段沿用 meta 默认（默认隐藏仍隐藏）', () => {
    const withNew = [...fields, mk('Ex1', false)];
    const out = applyColumnPrefs(withNew, { order: ['Id', 'Name', 'Remark', 'CreateTime'], hidden: [] });
    expect(out.find((f) => f.field.name === 'Ex1')!.field.visible).toBe(false);
  });

  it('字段名大小写不敏感匹配', () => {
    const out = applyColumnPrefs(fields, { order: ['name', 'id'], hidden: ['REMARK'] });
    expect(names(out).slice(0, 2)).toEqual(['Name', 'Id']);
    expect(out.find((f) => f.field.name === 'Remark')!.field.visible).toBe(false);
  });
});
