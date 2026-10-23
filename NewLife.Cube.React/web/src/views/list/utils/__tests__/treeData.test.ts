/**
 * 树形列表工具单元测试（LIST-17）
 */
import { describe, expect, it } from 'vitest';
import { buildTreeRows, detectTreeField } from '../treeData';
import type { FieldMapping } from '@newlifex/field-mapping';
import type { DataField } from '@newlifex/api-core';

function mapping(name: string, partial: Partial<DataField> = {}): FieldMapping {
  return { widget: 'text', field: { name, typeName: 'Int32', ...partial } };
}

describe('buildTreeRows', () => {
  it('按父字段组装两层节点，保持行对象其余字段', () => {
    const rows = [
      { Id: 1, Name: '根', ParentID: 0 },
      { Id: 2, Name: '子甲', ParentID: 1 },
      { Id: 3, Name: '子乙', ParentID: 1 },
    ];
    const tree = buildTreeRows(rows, 'Id', 'ParentID');
    expect(tree).toHaveLength(1);
    expect(tree[0].Name).toBe('根');
    const children = tree[0].children as Record<string, unknown>[];
    expect(children.map((c) => c.Name)).toEqual(['子甲', '子乙']);
    // 不修改入参
    expect((rows[0] as { children?: unknown }).children).toBeUndefined();
  });

  it('父键为空 / 0 / -1 或找不到父行时视为根节点', () => {
    const rows = [
      { Id: 1, ParentID: null },
      { Id: 2, ParentID: 0 },
      { Id: 3, ParentID: -1 },
      { Id: 4, ParentID: 999 },
    ];
    expect(buildTreeRows(rows, 'Id', 'ParentID')).toHaveLength(4);
  });

  it('多层嵌套：孙节点挂在子节点下', () => {
    const rows = [
      { Id: 1, ParentID: 0 },
      { Id: 2, ParentID: 1 },
      { Id: 3, ParentID: 2 },
    ];
    const tree = buildTreeRows(rows, 'Id', 'ParentID');
    const child = (tree[0].children as Record<string, unknown>[])[0];
    const grand = (child.children as Record<string, unknown>[])[0];
    expect(grand.Id).toBe(3);
  });

  it('父子互指的环导致无根时回退扁平数据', () => {
    const rows = [
      { Id: 1, ParentID: 2 },
      { Id: 2, ParentID: 1 },
    ];
    const out = buildTreeRows(rows, 'Id', 'ParentID');
    expect(out).toHaveLength(2);
    expect(out.every((r) => r.children === undefined)).toBe(true);
  });

  it('键值类型不一致（数字父键 / 字符串主键）仍能关联', () => {
    const rows = [
      { Id: '1', ParentID: '0' },
      { Id: 2, ParentID: 1 },
    ];
    const tree = buildTreeRows(rows, 'Id', 'ParentID');
    expect(tree).toHaveLength(1);
    expect((tree[0].children as unknown[])?.length).toBe(1);
  });
});

describe('detectTreeField', () => {
  it('命中 ParentID 字段时返回该字段名', () => {
    expect(detectTreeField([mapping('Id'), mapping('ParentID')], 'Id')).toBe('ParentID');
  });

  it('无父字段候选时返回 undefined', () => {
    expect(detectTreeField([mapping('Id'), mapping('Name', { typeName: 'String' })], 'Id')).toBeUndefined();
  });

  it('候选字段声明了 parentField（级联下拉）时不当作树形父字段', () => {
    expect(detectTreeField([mapping('Id'), mapping('ParentID', { parentField: 'Kind' })], 'Id')).toBeUndefined();
  });

  it('候选字段与主键同名时跳过', () => {
    expect(detectTreeField([mapping('ParentID')], 'ParentID')).toBeUndefined();
  });
});
