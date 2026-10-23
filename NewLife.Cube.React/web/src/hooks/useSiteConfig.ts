/**
 * 站点配置 Hook：加载 /Cube/Site（匿名可访问）
 *
 * 后端从 LoginConfig 拆出站点品牌后，登录页/注册页的品牌、Logo、背景、版权与语言选项统一由本接口提供。
 * 数据由全局 useSiteStore 持有，主布局与登录页共享，避免重复请求。
 * 站点配置是可选增强：接口失败时保持空配置，由调用方回退内置品牌，不阻塞登录。
 */
import { useCallback, useEffect } from 'react';
import { useSiteStore } from '@/stores/site';

/**
 * 加载站点配置
 *
 * @param tenant 租户标识（编号/编码/名称），透传到 ?tenant=；为空时由服务端按当前上下文解析
 * @returns 站点配置 / 加载状态 / 失败信息 / 重新加载函数
 */
export function useSiteConfig(tenant?: string) {
  const config = useSiteStore((s) => s.config);
  const loading = useSiteStore((s) => s.loading);
  const error = useSiteStore((s) => s.error);
  const load = useSiteStore((s) => s.load);

  useEffect(() => {
    void load(tenant);
  }, [load, tenant]);

  const reload = useCallback(() => load(tenant, true), [load, tenant]);

  return { config, loading, error, reload };
}
