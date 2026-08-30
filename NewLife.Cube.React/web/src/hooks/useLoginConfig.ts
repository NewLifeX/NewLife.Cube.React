/**
 * 登录配置 Hook：加载 /Auth/LoginConfig
 */
import { useCallback, useEffect, useState } from 'react';
import { api } from '@/api';
import type { CaptchaResult, LoginConfig, OAuthProvider } from '@newlifex/api-core';

/**
 * 归一化登录配置字段名（对齐 Vue 皮肤 core/utils/loginApi.ts 的 normalizeLoginConfig）
 *
 * 后端 /Auth/LoginConfig 返回的 OAuth 字段名存在变体：
 * - `oAuth`（.NET System.Text.Json camelCase 序列化 `OAuth` → `oAuth`）→ 标准字段 `oauth`
 * - `providers`（v1 旧版字段名）→ 标准字段 `oauth`
 *
 * 归一化后确保 LoginConfig.oauth 始终有值（如果后端返回了的话），
 * 否则登录页 `config?.oauth` 恒为空，第三方登录区块永不渲染。
 *
 * @param data 后端原始返回的 LoginConfig
 * @returns 归一化后的 LoginConfig
 */
function normalizeLoginConfig(data: LoginConfig): LoginConfig {
  // 浅拷贝，避免修改原始对象
  const result: LoginConfig = { ...data };

  // 用 Record 类型访问非标准字段名
  const raw = data as unknown as Record<string, unknown>;

  // 标准 oauth 为空时，尝试从 oAuth（后端 camelCase 变体）/ providers（v1 旧字段）补充
  if (!result.oauth || result.oauth.length === 0) {
    const oAuth = raw.oAuth as OAuthProvider[] | undefined;
    if (Array.isArray(oAuth) && oAuth.length > 0) {
      result.oauth = oAuth;
    } else if (Array.isArray(result.providers) && result.providers.length > 0) {
      result.oauth = result.providers;
    }
  }

  return result;
}

/**
 * 加载登录页配置
 *
 * @returns 登录配置 / 加载状态 / 加载失败信息 / 刷新函数
 */
export function useLoginConfig() {
  const [config, setConfig] = useState<LoginConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.user.getLoginConfig();
      // 归一化字段名（oAuth / providers → oauth），否则登录页读取 config.oauth 恒为空
      setConfig(res.data ? normalizeLoginConfig(res.data) : null);
      setError('');
    } catch {
      setError('登录配置加载失败');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  return { config, loading, error, reload: load };
}

/**
 * 加载图片验证码（SVG 算数题）
 *
 * @param enabled 是否启用（跟随 LoginConfig.login.captcha / register.captcha），关闭时不请求验证码接口
 * @returns 验证码 ID / SVG 图片 / 刷新函数
 */
export function useCaptcha(enabled = true) {
  const [captcha, setCaptcha] = useState<CaptchaResult | null>(null);

  const refresh = useCallback(async () => {
    try {
      const res = await api.user.getCaptcha();
      setCaptcha(res.data ?? null);
    } catch {
      setCaptcha(null);
    }
  }, []);

  useEffect(() => {
    // 开关关闭时不请求验证码；关闭→开启（配置异步加载完成）时自动触发首次拉取
    if (!enabled) {
      setCaptcha(null);
      return;
    }
    void refresh();
  }, [refresh, enabled]);

  return { captcha, refresh };
}
