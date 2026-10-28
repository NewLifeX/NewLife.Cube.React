/**
 * 登录配置 Hook：加载 /Auth/LoginConfig
 */
import { useCallback, useEffect, useState } from 'react';
import { api } from '@/api';
import { t } from '@/i18n';
import type { CaptchaResult, LoginConfig, OAuthProvider } from '@newlifex/cube';

/**
 * 归一化登录配置字段名（兼容尚未升级的后端）
 *
 * 后端 /Auth/LoginConfig 的 OAuth 字段名存在变体：
 * - `oAuth`（.NET camelCase 序列化 `OAuth` → `oAuth`）→ 标准字段 `oauth`
 * - `providers`（v1 旧版字段名）→ 标准字段 `oauth`
 *
 * 新版后端已显式序列化为 `oauth`；这里保留归一化，保证皮肤可对接旧版 NewLife.Cube。
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
    const providers = raw.providers as OAuthProvider[] | undefined;
    if (Array.isArray(oAuth) && oAuth.length > 0) {
      result.oauth = oAuth;
    } else if (Array.isArray(providers) && providers.length > 0) {
      result.oauth = providers;
    }
  }

  return result;
}

/**
 * 加载登录页配置
 *
 * @param tenant 租户标识（编号/编码/名称），登录链接可用 ?tenant= 指定
 * @returns 登录配置 / 加载状态 / 加载失败信息 / 刷新函数
 */
export function useLoginConfig(tenant?: string) {
  const [config, setConfig] = useState<LoginConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.user.getLoginConfig(tenant);
      // 归一化字段名（oAuth / providers → oauth），否则登录页读取 config.oauth 恒为空
      setConfig(res.data ? normalizeLoginConfig(res.data) : null);
      setError('');
    } catch {
      setError(t('登录配置加载失败'));
    } finally {
      setLoading(false);
    }
  }, [tenant]);

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
