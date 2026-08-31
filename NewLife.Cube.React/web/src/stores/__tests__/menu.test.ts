/**
 * 菜单扁平转换单元测试
 */
import { describe, expect, it } from 'vitest';
import { flattenMenu, resolveMenuTitle } from '@/stores/menu';
import type { MenuItem } from '@newlifex/api-core';

const tree: MenuItem[] = [
  {
    id: 1,
    name: 'system',
    displayName: '系统管理',
    parentID: 0,
    url: '/Admin',
    icon: 'fa-cog',
    visible: true,
    children: [
      {
        id: 2,
        name: 'user',
        displayName: '用户管理',
        parentID: 1,
        url: '/Admin/User',
        icon: 'fa-user',
        visible: true,
        children: [],
      },
      {
        id: 3,
        name: 'hidden',
        displayName: '隐藏菜单',
        parentID: 1,
        url: '/Admin/Hidden',
        visible: false,
        children: [],
      },
    ],
  },
];

describe('flattenMenu 树转扁平', () => {
  it('扁平化并保留父子关系', () => {
    const flat = flattenMenu(tree);
    expect(flat).toHaveLength(3); // 隐藏节点也保留（供标签页标题解析）
    expect(flat[0].path).toBe('/Admin');
    expect(flat[1].parentId).toBe(1);
  });

  it('保留隐藏节点并标记 visible=false', () => {
    const flat = flattenMenu(tree);
    const hidden = flat.find((m) => m.path === '/Admin/Hidden');
    expect(hidden).toBeDefined();
    expect(hidden?.visible).toBe(false);
  });

  it('可见节点 visible=true', () => {
    const flat = flattenMenu(tree);
    expect(flat.find((m) => m.path === '/Admin/User')?.visible).toBe(true);
  });
});

describe('resolveMenuTitle 菜单标题解析', () => {
  const flat = flattenMenu(tree);

  it('命中返回菜单显示名', () => {
    expect(resolveMenuTitle(flat, '/Admin/User')).toBe('用户管理');
  });

  it('大小写不敏感匹配', () => {
    expect(resolveMenuTitle(flat, '/admin/user')).toBe('用户管理');
  });

  it('未命中返回 fallback', () => {
    expect(resolveMenuTitle(flat, '/No/Such', '默认页面')).toBe('默认页面');
    expect(resolveMenuTitle(flat, '/No/Such')).toBe('');
  });
});
