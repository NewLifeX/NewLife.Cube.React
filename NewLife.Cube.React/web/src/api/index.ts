/**
 * 全局 API 客户端（对齐 Vue 皮肤 composables/useCubeApi.ts）
 *
 * 基于 @newlifex/cube 创建统一实例，提供：
 * - 实体/页面接口（page/client）→ 自动补 /api 前缀
 * - 服务接口（user/menu/config：/Auth /Cube /Sso）→ 同源不带 /api
 * - 统一错误处理：字段级错误 / 业务错误 / 401 未授权
 */
import { createCubeApi, clearPageMetaCache, type CubeApi, type TokenStorage } from '@newlifex/cube';
import { wrapPageActions } from './pageActions';
import { getConfig } from '@/configure';
import { getCurrentLanguage } from '@/i18n';
import { getMessage } from '@/utils/antdApp';

/** Token 变更事件（登录/登出时派发，供响应式登录态使用） */
export const CUBE_TOKEN_EVENT = 'cube:token-change';

/** 从 Cookie 读取指定键（localStorage 丢失时回退） */
function readCookie(key: string): string | null {
  const match = document.cookie.match(new RegExp(`(?:^|;\\s*)${key}=([^;]*)`));
  return match ? decodeURIComponent(match[1]) : null;
}

/**
 * 最近一次读取到的有效令牌
 *
 * 共享包在业务码 401 时会**先** `clearToken()` 再回调 `onUnauthorized`，
 * 调用方拿不到被清掉的令牌；这里在每次读取时留一份，供辅助接口偶发 401 时恢复会话。
 */
let lastValidToken: string | null = null;

/**
 * 双通道 Token 存储：localStorage 优先 + Cookie 兜底
 *
 * 「保存密码」登录后 token 同时写入持久 Cookie（对齐 MVC 版写 365 天 Cookie 的行为），
 * 当 localStorage 被浏览器清理但 Cookie 保留时，仍可从 Cookie 恢复登录态免登录。
 */
const tokenStorage: TokenStorage = {
  getToken: () => {
    const token = localStorage.getItem('token') ?? readCookie('token');
    if (token) lastValidToken = token;
    return token;
  },
  setToken: (t, expireIn) => {
    lastValidToken = t;
    localStorage.setItem('token', t);
    // 有有效期（保存密码=365 天）写持久 Cookie，否则会话级
    const exp = expireIn && expireIn > 0 ? `; max-age=${expireIn}` : '';
    document.cookie = `token=${encodeURIComponent(t)}; path=/; SameSite=Lax${exp}`;
    window.dispatchEvent(new Event(CUBE_TOKEN_EVENT));
  },
  clearToken: () => {
    localStorage.removeItem('token');
    document.cookie = 'token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
    window.dispatchEvent(new Event(CUBE_TOKEN_EVENT));
  },
};

// Token 变更（登录/登出/切换账号）时清空页面元数据缓存，避免串用上一账号的页面配置
window.addEventListener(CUBE_TOKEN_EVENT, () => clearPageMetaCache());

// 同一响应若携带 fieldErrors，onFieldError 会弹出更精确的字段提示；
// 此处标记抑制紧随其后的 onBusinessError，避免"操作失败！xxx"与"xxx"重复弹出
let fieldErrorShown = false;

/** 允许 401 软失败的辅助接口前缀（不打断会话，由调用方降级/重试）
 *
 * `/Cube/*` 为服务端点（菜单 / 地区 / LOV / 配置 / 头像）：实测并发下后端会瞬时返回
 * code=401（同一时刻 `/Auth/Info` 正常），属于权限缓存刷新窗口问题（已登记 FIX-5）。
 * 这些接口失败只影响局部功能，不应把用户踢下线；真正的会话失效会由实体接口 401 兜住。
 */
const SOFT_401_PREFIXES = ['/Cube/'];

/**
 * 全局 CubeApi 实例
 */
export const api: CubeApi = createCubeApi({
  baseURL: getConfig().request.baseUrl,
  tokenStorage,
  tokenHeaderPrefix: getConfig().request.tokenHeaderPrefix ?? 'Bearer ',
  timeout: getConfig().request.timeout,
  // 元数据缓存按语言隔离；账号切换由 token 事件清空，租户切换会刷新页面
  metaCacheScope: () => getCurrentLanguage(),
  // 接入附加请求头（如多租户 X-Tenant），实体/服务两条链均生效
  // Accept-Language 与 i18n 当前语言保持一致，后端按同一条链路返回本地化消息
  additionalRequestHeaders: () => {
    const extra = getConfig().request.additionalRequestHeaders;
    const headers = !extra ? {} : typeof extra === 'function' ? extra() : extra;
    return { 'Accept-Language': getCurrentLanguage(), ...headers };
  },
  onFieldError: (fieldErrors) => {
    // 统一展示字段级验证错误（如"编码不可以为空！"）
    fieldErrorShown = true;
    getMessage().error(fieldErrors.map((e) => e.message).join('；'));
  },
  onBusinessError: (_code, msg) => {
    // 微任务中执行：若同一响应已通过 onFieldError 弹出字段级错误则跳过
    Promise.resolve()
      .then(() => {
        if (fieldErrorShown) return;
        getMessage().error(msg);
      })
      .finally(() => {
        fieldErrorShown = false;
      });
  },
  onUnauthorized: (url) => {
    // 记录触发登录跳转的请求（HTTP 401 或业务 code=401），便于排查共享会话被何处打断
    console.warn(`[cube] unauthorized: ${url ?? '-'}`);
    // 辅助接口的偶发 401 不打断会话：菜单失败只影响导航，不应把用户踢下线。
    // 实测并发下 /Auth/Info 正常而 /Cube/MenuTree 返回 code=401（后端瞬时问题，已登记 FIX-5）。
    if (url && SOFT_401_PREFIXES.some((p) => url.startsWith(p)) && lastValidToken) {
      tokenStorage.setToken(lastValidToken);
      return;
    }
    // 401 → 清除 token 并跳转登录页（避免在登录页重复跳转）
    const { pathname } = window.location;
    const { loginPageUrl } = getConfig().auth;
    if (!pathname.startsWith(loginPageUrl)) {
      window.location.href = `${loginPageUrl}?r=${encodeURIComponent(pathname + window.location.search)}`;
    }
  },
});

// 兼容层：补前导斜杠，规避上游 resolveRequestUrl 拼出 /apiAdmin/...（见 pageActions.ts）
wrapPageActions(api);

export default api;
