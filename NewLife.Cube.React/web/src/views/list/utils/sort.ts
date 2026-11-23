/**
 * 列表初始排序
 *
 * 后端 `PageSetting.OrderByKey` 的语义是“数字主键降序”。前端首次加载必须同时发送
 * `sort=<主键>&desc=true`；只发送 `sort=<主键>` 会被后端当作升序，覆盖默认降序。
 */

/** 初始排序信息 */
export interface InitialSort {
  /** 排序列（通常是主键字段名） */
  field: string;
  /** 是否降序 */
  desc: boolean;
}

/**
 * 根据页面能力计算首次加载的排序参数
 *
 * @param orderByKey 后端 `PageSetting.OrderByKey`（数字主键降序）
 * @param pkField 主键字段名
 * @returns 排序参数；不需要按主键排序时返回 undefined
 */
export function resolveInitialSort(
  orderByKey: boolean | undefined,
  pkField: string | undefined,
): InitialSort | undefined {
  if (!orderByKey || !pkField) return undefined;
  return { field: pkField, desc: true };
}

export default { resolveInitialSort };
