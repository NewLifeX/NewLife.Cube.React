/**
 * 路由路径判定工具
 *
 * 这些判定同时被动态实体页（DefaultEntity）和测试使用，单独抽出避免在组件内联逻辑
 * 出现“字符串 includes”式误判。
 */

/** 表单类路径后缀（编辑/新增/详情） */
const FORM_SUFFIX = /\/+(edit|add|new|detail)$/i;

/**
 * 是否表单类路径（含独立的 `?id=` 参数，或路径以 /Edit /Add /New /Detail 结尾）
 *
 * 注意：不能直接用 `search.includes('id=')` 判断，`?userId=1` 也包含 `id=`，
 * 会被误判为表单页，导致关联列表页（如 /Admin/UserToken?userId=1）打开新增表单。
 *
 * @param pathname 当前路径
 * @param search 当前查询串（可带或不带 `?`）
 * @returns 命中表单页返回 true
 */
export function isFormPath(pathname: string, search: string): boolean {
  const query = search.startsWith('?') ? search.slice(1) : search;
  const id = new URLSearchParams(query).get('id');
  if (id != null && id !== '') return true;

  return FORM_SUFFIX.test(pathname);
}

export default { isFormPath };
