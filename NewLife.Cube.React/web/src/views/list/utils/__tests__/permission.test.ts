/**
 * 角色权限纯函数单元测试
 *
 * 覆盖：级联子树收集、快捷授权（只读/全部/无权限）应用、权限字符串序列化。
 * 重点回归：PermissionFlags.All(0xFFFFFFFF) 序列化为 Int32 -1（后端 Int32.TryParse 兼容）。
 */
import { describe, expect, it } from 'vitest';
import {
  PERMISSION_ALL,
  buildQuickGranted,
  collectSubtreeIds,
  serializePermissions,
  type PermissionNode,
} from '../permission';

/** 构造测试权限树：一级含子孙、三级结构、叶子含额外权限位（16 审批） */
const TREE: PermissionNode[] = [
  {
    id: 1,
    name: 'Admin',
    displayName: '系统管理',
    children: [
      {
        id: 11,
        name: 'User',
        displayName: '用户',
        flags: [
          { value: 1, name: '查看' },
          { value: 2, name: '添加' },
          { value: 4, name: '修改' },
          { value: 8, name: '删除' },
        ],
      },
      {
        id: 12,
        name: 'App',
        displayName: '应用',
        flags: [
          { value: 1, name: '查看' },
          { value: 2, name: '添加' },
          { value: 4, name: '修改' },
          { value: 8, name: '删除' },
          { value: 16, name: '审批' },
        ],
        children: [
          {
            id: 121,
            name: 'AppLog',
            displayName: '应用日志',
            flags: [
              { value: 1, name: '查看' },
              { value: 2, name: '添加' },
              { value: 4, name: '修改' },
              { value: 8, name: '删除' },
            ],
          },
        ],
      },
    ],
  },
  {
    id: 2,
    name: 'Report',
    displayName: '报表',
    flags: [
      { value: 1, name: '查看' },
      { value: 16, name: '导出' },
    ],
  },
];

describe('collectSubtreeIds 子树收集', () => {
  it('一级菜单：返回自身及所有子孙 id', () => {
    expect(collectSubtreeIds(TREE, 1)).toEqual([1, 11, 12, 121]);
  });

  it('二级菜单：返回自身及孙级 id', () => {
    expect(collectSubtreeIds(TREE, 12)).toEqual([12, 121]);
  });

  it('叶子菜单：仅返回自身', () => {
    expect(collectSubtreeIds(TREE, 121)).toEqual([121]);
    expect(collectSubtreeIds(TREE, 2)).toEqual([2]);
  });

  it('不存在的 id：返回空数组', () => {
    expect(collectSubtreeIds(TREE, 999)).toEqual([]);
  });
});

describe('buildQuickGranted 快捷授权', () => {
  it('只读：子树每个菜单授予查看(1)', () => {
    expect(buildQuickGranted(TREE, 1, 'readonly')).toEqual({ 1: 1, 11: 1, 12: 1, 121: 1 });
  });

  it('全部：子树每个菜单授予全部权限位(0xFFFFFFFF)', () => {
    const rs = buildQuickGranted(TREE, 1, 'all');
    expect(Object.values(rs).every((f) => f === PERMISSION_ALL)).toBe(true);
    expect(Object.keys(rs).map(Number).sort()).toEqual([1, 11, 12, 121]);
  });

  it('无权限：返回空对象（保存时清除子树全部权限）', () => {
    expect(buildQuickGranted(TREE, 1, 'none')).toEqual({});
  });

  it('叶子菜单：快捷仅作用于自身', () => {
    expect(buildQuickGranted(TREE, 2, 'readonly')).toEqual({ 2: 1 });
    expect(buildQuickGranted(TREE, 2, 'all')).toEqual({ 2: PERMISSION_ALL });
  });

  it('不存在的 id：返回空对象', () => {
    expect(buildQuickGranted(TREE, 999, 'readonly')).toEqual({});
  });
});

describe('serializePermissions 权限字符串序列化', () => {
  it('全部权限位 0xFFFFFFFF → 序列化为 -1（后端 Int32 兼容，关键回归）', () => {
    expect(serializePermissions({ 5: PERMISSION_ALL })).toBe('5#-1');
  });

  it('普通权限位不受影响', () => {
    expect(serializePermissions({ 3: 15 })).toBe('3#15');
  });

  it('混合含全部与普通：按 id 升序、All 转 -1', () => {
    const rs = serializePermissions({ 5: PERMISSION_ALL, 2: 8, 1: 15 });
    expect(rs).toBe('1#15,2#8,5#-1');
  });

  it('过滤 0 权限项', () => {
    expect(serializePermissions({ 1: 0, 2: 1 })).toBe('2#1');
  });

  it('空字典返回空字符串', () => {
    expect(serializePermissions({})).toBe('');
  });
});
