/**
 * 特殊页路径判定（单一事实源）
 *
 * 这些页面**不是**实体 CRUD 页，后端没有 `${type}/meta` 端点：
 * - 服务器信息 `/Admin/Index/Main`
 * - 数据库页 `/Admin/Db`
 * - 工作台部件 `/Cube/Widget`
 * - 视图解析诊断 `/Cube/ViewTrace`
 *
 * 路由层（DefaultEntityPage）与列表分发层（DefaultListPage）都必须用同一份清单，
 * 否则会在其中一层发起多余的 meta 探测，产生 404 控制台噪音并拖慢首屏。
 */

/** 特殊页路径后缀（小写匹配） */
const SPECIAL_SUFFIXES = ['/index/main', '/db', '/cube/widget', '/widget', '/cube/viewtrace', '/viewtrace'];

/**
 * 是否已知特殊页（不走实体 meta 探测，直接按路径分发）
 *
 * @param pathname 当前路由路径
 * @returns 命中特殊页返回 true
 */
export function isSpecialApiPath(pathname: string): boolean {
  const lower = (pathname || '').toLowerCase();
  return SPECIAL_SUFFIXES.some((suffix) => lower.endsWith(suffix));
}
