/**
 * 菜单搜索单元测试
 *
 * 覆盖：显示名/拼音/首字母/父级路径匹配、隐藏菜单参与、无路径节点过滤、排序与条数上限。
 */
import { describe, expect, it } from 'vitest';
import { getMenuPath, getSearchTokens, isSearchableMenu, searchMenus } from '../menuSearch';
import type { FlatMenuItem } from '@/stores/menu';

/** 构造扁平菜单项 */
function menu(partial: Partial<FlatMenuItem> & Pick<FlatMenuItem, 'id' | 'name'>): FlatMenuItem {
  return { path: '', visible: true, ...partial };
}

const menus: FlatMenuItem[] = [
  menu({ id: 1, name: 'system', title: '系统管理', path: '/Admin', pinYin: 'xitongguanli', initials: 'xtgl' }),
  menu({
    id: 2,
    name: 'user',
    title: '用户管理',
    path: '/Admin/User',
    parentId: 1,
    pinYin: 'yonghuguanli',
    initials: 'yhgl',
  }),
  menu({
    id: 3,
    name: 'hidden',
    title: '用户在线',
    path: '/Admin/UserOnline',
    parentId: 1,
    visible: false,
    pinYin: 'yonghuxianza i',
    initials: 'yhxz',
  }),
  menu({ id: 4, name: 'Group', title: '', path: '', children: [] }),
  menu({ id: 5, name: 'area-root', title: '区域', path: '~/Cube' }),
];

describe('getSearchTokens', () => {
  it('按空白切分并忽略大小写', () => {
    expect(getSearchTokens('  System  USER ')).toEqual(['system', 'user']);
    expect(getSearchTokens('')).toEqual([]);
  });
});

describe('isSearchableMenu', () => {
  it('隐藏菜单可搜索，无路径与后端区域根菜单不参与', () => {
    expect(isSearchableMenu(menus[2])).toBe(true);
    expect(isSearchableMenu(menus[3])).toBe(false);
    expect(isSearchableMenu(menus[4])).toBe(false);
  });
});

describe('getMenuPath', () => {
  it('沿 parentId 拼接显示名路径', () => {
    expect(getMenuPath(menus, menus[1])).toBe('系统管理 › 用户管理');
  });
});

describe('searchMenus', () => {
  it('显示名包含匹配', () => {
    const out = searchMenus(menus, '用户');
    expect(out.map((r) => r.menu.name)).toEqual(['user', 'hidden']);
  });

  it('拼音全拼与首字母匹配', () => {
    expect(searchMenus(menus, 'yonghu').map((r) => r.menu.name)).toContain('user');
    expect(searchMenus(menus, 'yhgl').map((r) => r.menu.name)).toEqual(['user']);
  });

  it('多关键字可跨父级路径命中', () => {
    const out = searchMenus(menus, '系统 用户');
    expect(out.map((r) => r.menu.name)).toEqual(['user', 'hidden']);
    expect(searchMenus(menus, 'xitong yhgl').map((r) => r.menu.name)).toEqual(['user']);
  });

  it('隐藏菜单参与搜索', () => {
    expect(searchMenus(menus, '在线').map((r) => r.menu.name)).toEqual(['hidden']);
  });

  it('无路径节点与区域根菜单不参与', () => {
    expect(searchMenus(menus, 'Group')).toEqual([]);
    expect(searchMenus(menus, '区域')).toEqual([]);
  });

  it('精确显示名优先于包含匹配', () => {
    const list = [
      menu({ id: 10, name: 'a', title: '用户管理', path: '/a' }),
      menu({ id: 11, name: 'b', title: '用户', path: '/b' }),
    ];
    expect(searchMenus(list, '用户')[0].menu.name).toBe('b');
  });

  it('限制返回条数', () => {
    const list = Array.from({ length: 20 }, (_, i) => menu({ id: i + 1, name: `m${i}`, title: `菜单${i}`, path: `/m/${i}` }));
    expect(searchMenus(list, '菜单', 5)).toHaveLength(5);
  });
});
