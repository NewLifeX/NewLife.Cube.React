/**
 * 站点配置 Store
 *
 * 品牌字段已从登录配置拆到匿名接口 `/Cube/Site`。登录页、主布局与首页共享同一份配置，
 * 避免服务端设置的系统名称/Logo 只在登录页生效；并发挂载时复用同一个请求。
 */
import { create } from 'zustand';
import type { SiteConfig } from '@newlifex/cube';
import { api } from '@/api';
import { applySiteLanguage } from '@/i18n';

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

/**
 * 将站点品牌写入浏览器标题与图标
 *
 * 站点未配置名称/Logo 时保持默认，避免把空品牌写进页面。
 * @param config 站点配置
 */
function applySiteBrand(config: SiteConfig | null) {
  if (!config || typeof document === 'undefined') return;

  if (config.name) document.title = config.name;
  if (config.logo) {
    let link = document.head.querySelector<HTMLLinkElement>('link[rel="icon"]');
    if (!link) {
      link = document.createElement('link');
      link.rel = 'icon';
      document.head.appendChild(link);
    }
    link.href = config.logo;
  }
}

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
        // 站点/租户品牌：标题与 favicon 跟随 /Cube/Site
        applySiteBrand(config);
        // 站点/租户语言：current/options/locked 参与启动链与切换器白名单（FND-15）
        applySiteLanguage(config?.language);
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
