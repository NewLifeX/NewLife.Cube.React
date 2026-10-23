/**
 * 站点配置 Hook：加载 /Cube/Site（匿名可访问）
 *
 * 后端从 LoginConfig 拆出站点品牌后，登录页/注册页的品牌、Logo、背景、版权与语言选项统一由本接口提供。
 * 站点配置是可选增强：接口失败时保持空配置，由调用方回退内置品牌，不阻塞登录。
 */
import { useCallback, useEffect, useState } from 'react';
import { api } from '@/api';
import type { SiteConfig } from '@newlifex/api-core';

/**
 * 加载站点配置
 *
 * @param tenant 租户标识（编号/编码/名称），透传到 ?tenant=；为空时由服务端按当前上下文解析
 * @returns 站点配置 / 加载状态 / 失败信息 / 重新加载函数
 */
export function useSiteConfig(tenant?: string) {
  const [config, setConfig] = useState<SiteConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.site.getSite(tenant);
      setConfig(res.data ?? null);
      setError('');
    } catch (err) {
      // 站点配置失败不阻塞登录页，仅记录错误供调试/展示
      setConfig(null);
      setError((err as Error)?.message || '站点配置加载失败');
    } finally {
      setLoading(false);
    }
  }, [tenant]);

  useEffect(() => {
    void load();
  }, [load]);

  return { config, loading, error, reload: load };
}
