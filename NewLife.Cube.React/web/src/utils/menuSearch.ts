/**
 * 菜单模糊搜索（对齐魔方菜单搜索口径）
 *
 * 数据来自 /Cube/MenuTree：后端按库中源文计算并下发 `pinYin`/`initials`，
 * 隐藏菜单也参与搜索（隐藏页可由链接打开，同样应能搜到），仅过滤无路径的分类节点。
 */
import type { FlatMenuItem } from '@/stores/menu';

/** 菜单搜索结果。path 为从顶层到当前菜单的显示名路径 */
export interface MenuSearchResult {
  menu: FlatMenuItem;
  path: string;
}

/** 关键词切分：忽略大小写，空白分隔 */
export function getSearchTokens(keyword?: string): string[] {
  return (keyword ?? '')
    .trim()
    .toLowerCase()
    .split(/\s+/)
    .filter((token) => token.length > 0);
}

/** 是否参与搜索：隐藏菜单同样参与，后端区域根菜单（~）与无路径的分类节点不参与 */
export function isSearchableMenu(menu: FlatMenuItem): boolean {
  const path = menu.path;
  return !!path && path !== '~' && !path.startsWith('~/');
}

interface MenuPathInfo {
  path: string;
  pinYin: string;
  initials: string;
}

/** 沿 parentId 回溯，拼接显示名路径与拼音。父链断裂或成环时安全退出 */
function getMenuPathInfo(map: Map<string, FlatMenuItem>, menu: FlatMenuItem): MenuPathInfo {
  const names: string[] = [];
  const pinyins: string[] = [];
  const initials: string[] = [];
  const visited = new Set<string>();
  let current: FlatMenuItem | undefined = menu;

  while (current && !visited.has(String(current.id))) {
    visited.add(String(current.id));
    const name = current.title || current.name;
    if (name) names.unshift(name);
    if (current.pinYin) pinyins.unshift(current.pinYin);
    if (current.initials) initials.unshift(current.initials);
    current = current.parentId != null ? map.get(String(current.parentId)) : undefined;
  }

  return { path: names.join(' › '), pinYin: pinyins.join(' '), initials: initials.join(' ') };
}

/**
 * 获取菜单完整层级路径
 *
 * @param menus 平铺菜单
 * @param menu 当前菜单
 * @returns 层级路径，如 `系统管理 › 用户`
 */
export function getMenuPath(menus: FlatMenuItem[], menu: FlatMenuItem): string {
  return getMenuPathInfo(
    new Map(menus.map((item) => [String(item.id), item])),
    menu,
  ).path;
}

/**
 * 显示名匹配优先级
 *
 * 0 完全相同，1 显示名前缀，2 首字母前缀，3 全拼前缀，4 名称前缀，
 * 5 显示名包含，6 名称包含，7 路径拼音前缀，8 地址包含，9 其它。
 */
function scoreMenu(menu: FlatMenuItem, keyword: string, pathInfo: MenuPathInfo): number {
  const title = (menu.title || '').toLowerCase();
  const name = (menu.name || '').toLowerCase();
  const path = (menu.path || '').toLowerCase();
  const initials = (menu.initials || '').toLowerCase();
  const pinyin = (menu.pinYin || '').toLowerCase();
  const pathPy = pathInfo.pinYin.toLowerCase();
  const pathIni = pathInfo.initials.toLowerCase();

  if (title === keyword) return 0;
  if (title.startsWith(keyword)) return 1;
  if (initials.startsWith(keyword)) return 2;
  if (pinyin.startsWith(keyword)) return 3;
  if (name.startsWith(keyword)) return 4;
  if (title.includes(keyword)) return 5;
  if (name.includes(keyword)) return 6;
  if (pathIni.startsWith(keyword) || pathPy.startsWith(keyword)) return 7;
  if (path.includes(keyword)) return 8;
  return 9;
}

/**
 * 菜单模糊搜索
 *
 * 空格分隔多关键字时要求全部命中；显示名、菜单名、地址、拼音与父级路径任一命中即可。
 * 结果按匹配优先级排序，同优先级按路径长度升序。
 *
 * @param menus 平铺菜单
 * @param keyword 搜索关键字
 * @param limit 最大返回条数
 * @returns 搜索结果，未命中返回空数组
 */
export function searchMenus(
  menus: FlatMenuItem[] | undefined,
  keyword: string,
  limit = 10,
): MenuSearchResult[] {
  const tokens = getSearchTokens(keyword);
  if (tokens.length === 0 || !menus?.length) return [];

  const pathMap = new Map(menus.map((item) => [String(item.id), item]));
  const candidates: { menu: FlatMenuItem; info: MenuPathInfo }[] = [];
  for (const menu of menus) {
    if (!isSearchableMenu(menu)) continue;

    // 父级显示名/拼音也参与匹配：输入“系统 用户”或“xitong yh”可命中“系统管理 › 用户”
    const info = getMenuPathInfo(pathMap, menu);
    const haystack = [
      menu.title,
      menu.name,
      menu.path,
      menu.pinYin,
      menu.initials,
      info.path,
      info.pinYin,
      info.initials,
    ]
      .join(' ')
      .toLowerCase();
    if (!tokens.every((token) => haystack.includes(token))) continue;

    candidates.push({ menu, info });
  }

  const first = tokens[0];
  candidates.sort((a, b) => {
    const scoreA = scoreMenu(a.menu, first, a.info);
    const scoreB = scoreMenu(b.menu, first, b.info);
    return scoreA !== scoreB ? scoreA - scoreB : a.info.path.length - b.info.path.length;
  });

  return candidates.slice(0, limit).map(({ menu, info }) => ({ menu, path: info.path }));
}
