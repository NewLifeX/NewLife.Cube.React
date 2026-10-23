/**
 * 站点配置 Store
 *
 * 品牌字段已从登录配置拆到匿名接口 `/Cube/Site`。登录页、主布局与首页共享同一份配置，
 * 避免服务端设置的系统名称/Logo 只在登录页生效；并发挂载时复用同一个请求。
 */
import { create } from 'zustand';
import type { SiteConfig } from '@newlifex/api-core';
import { api } from '@/api';

interface SiteState {
  /** 当前站点配置；接口失败时保持 null，由调用方回退内置品牌 */
  config: SiteConfig | null;
  /** 配置对应的租户标识，用于切换租户链接时重新加载 */
  loadedTenant?: string;
  /** 是否正在加载 */
  loading: boolean;
  /** 加载失败信息，供登录页/调试展示 */
  error: string;
  /**
   * 加载站点配置
   * @param tenant 租户标识（编号/编码/名称），为空时由服务端按当前上下文解析
   * @param force 强制重新请求，忽略已有配置
   * @returns 站点配置，失败时返回已有配置或 null
   */
  load: (tenant?: string, force?: boolean) => Promise<SiteConfig | null>;
}

let pending: Promise<SiteConfig | null> | null = null;

export const useSiteStore = create<SiteState>((set, get) => ({
  config: null,
  loadedTenant: undefined,
  loading: false,
  error: '',

  load: async (tenant, force = false) => {
    if (!force && get().config && get().loadedTenant === tenant) return get().config;
    if (pending) return pending;

    set({ loading: true, error: '' });
    pending = api.site
      .getSite(tenant)
      .then((res) => {
        const config = res.data ?? null;
        set({ config, loadedTenant: tenant, loading: false });
        return config;
      })
      .catch((err: unknown) => {
        set({
          loading: false,
          error: (err as Error)?.message || '站点配置加载失败',
        });
        return get().config;
      })
      .finally(() => {
        pending = null;
      });

    return pending;
  },
}));

export default useSiteStore;
