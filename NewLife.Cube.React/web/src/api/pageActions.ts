/**
 * `page.getAction` / `page.postAction` 的路径兼容层
 *
 * 上游 `@newlifex/cube` 的 `resolveRequestUrl` 直接按 `${base}/api${path}` 拼接，
 * 当调用方传不带前导斜杠的 type（共享 loader 传的正是 `Admin/Index`）时得到
 * `/apiAdmin/Index/Dashboard`，请求 404。这里统一补齐前导斜杠。
 *
 * 上游已修复（NewLife.Cube@91b40587），**待包含该修复的 npm 版本发布后**可删除本文件与调用。
 */
import type { CubeApi } from '@newlifex/cube';

/**
 * 补齐前导斜杠
 *
 * @param type 控制器路径，如 `Admin/Index` 或 `/Admin/Index`
 * @returns 带前导斜杠的路径
 * @example
 * ```ts
 * withLeadingSlash('Admin/Index');  // '/Admin/Index'
 * withLeadingSlash('/Admin/Index'); // '/Admin/Index'
 * ```
 */
export const withLeadingSlash = (type: string) => (type.startsWith('/') ? type : `/${type}`);

/**
 * 就地包装 `api.page` 的 getAction / postAction：type 统一补前导斜杠
 *
 * 其余 page 方法原样保留；包装幂等（重复调用不会叠加）。
 *
 * @param api CubeApi 实例
 */
export function wrapPageActions(api: CubeApi): void {
  const pageApi = api.page;
  api.page = {
    ...pageApi,
    getAction: <T,>(type: string, action: string, params?: Record<string, unknown>) =>
      pageApi.getAction<T>(withLeadingSlash(type), action, params),
    postAction: <T,>(type: string, action: string, data?: unknown) =>
      pageApi.postAction<T>(withLeadingSlash(type), action, data),
  };
}
