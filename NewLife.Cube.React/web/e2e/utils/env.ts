/**
 * E2E 环境辅助
 *
 * 魔方「单会话」策略：同一账号再次登录会吊销此前颁发的令牌。因此凡是**重新登录**的用例
 * （保存密码、SSO 回调、退出登录、权限 API 集成）必须使用**副账号**，否则会让共享
 * storageState（`.auth/admin.json`）失效，导致后续 spec 全部 401。
 *
 * 约定：
 * - 主账号：`ADMIN_USER` / `ADMIN_PASS`（auth.setup 使用，写入共享 storageState）
 * - 副账号：`E2E_ALT_USER` / `E2E_ALT_PASS`（未配置时回退主账号，此时会话污染无法避免，
 *   仅用于本地临时验证；CI/本地回归请创建独立副账号）
 */

/** 共享登录态文件（auth.setup 写入，chromium project 复用） */
export const SHARED_STATE = '.auth/admin.json';

/** 主账号（auth.setup 与共享会话） */
export const ADMIN_USER = process.env.ADMIN_USER || 'admin';
/** 主账号口令 */
export const ADMIN_PASS = process.env.ADMIN_PASS || 'admin';

/** 副账号（会重新登录的用例专用，避免吊销共享令牌） */
export const ALT_USER = process.env.E2E_ALT_USER || ADMIN_USER;
/** 副账号口令 */
export const ALT_PASS = process.env.E2E_ALT_PASS || ADMIN_PASS;

/**
 * 探测后端是否具备某端点（用于环境能力差异跳过用例）
 *
 * @param status HTTP 状态码
 * @returns 非 404 视为可用（401/403 说明端点存在但未授权，仍算部署了就绪）
 */
export function endpointExists(status: number): boolean {
  return status !== 404;
}
