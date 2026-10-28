/**
 * 页面元数据形态判定（实体页 vs 对象/配置页）
 *
 * 后端 `GET {type}/meta`：
 * - 实体控制器（ReadOnlyEntityController/EntityController）返回 `{ entity, setting, list, form, add, detail, search, toolbar, ui }`
 * - 对象/配置控制器（ObjectController/ConfigController）只返回 `{ setting, form }`，没有 `list`
 *
 * 因此以 `list` 是否为数组作为实体页判据；旧后端未匹配的请求会被 SPA 回退成 HTML 字符串，同样判为非实体页。
 */
import type { ApiResponse, PageMeta } from '@newlifex/cube';

/**
 * 判断 meta 响应是否为实体页元数据
 *
 * @param res `api.page.getPage` 的返回值（业务体 ApiResponse，旧后端可能为 HTML 字符串）
 * @returns 是实体页返回 true
 */
export function isEntityMeta(res: ApiResponse<PageMeta> | string | null | undefined): boolean {
  if (!res || typeof res === 'string') return false;

  const meta = res.data;
  if (!meta || typeof meta === 'string') return false;

  return Array.isArray(meta.list);
}
