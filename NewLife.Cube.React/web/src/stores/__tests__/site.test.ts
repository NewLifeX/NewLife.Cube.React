/**
 * site store 单元测试（/Cube/Site 站点品牌）
 *
 * 覆盖：站点名称写入 document.title、Logo 写入 favicon。
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { useSiteStore } from '../site';

const { mockGetSite } = vi.hoisted(() => ({
  mockGetSite: vi.fn(),
}));

vi.mock('@/api', () => ({
  api: { site: { getSite: mockGetSite } },
}));

describe('site store — 站点品牌', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useSiteStore.setState({ config: null, loadedTenant: undefined, loading: false, error: '' });
  });

  afterEach(() => {
    document.title = '';
    document.head.querySelectorAll('link[rel="icon"]').forEach((el) => el.remove());
    localStorage.clear();
  });

  it('加载后写入站点标题与图标', async () => {
    mockGetSite.mockResolvedValue({ code: 0, data: { name: 'Acme', logo: '/logo.png' } });

    await useSiteStore.getState().load();

    expect(document.title).toBe('Acme');
    expect(document.head.querySelector('link[rel="icon"]')?.getAttribute('href')).toBe('/logo.png');
  });

  it('站点未配置名称与图标时保持默认', async () => {
    document.title = '魔方 React';
    mockGetSite.mockResolvedValue({ code: 0, data: { name: null, logo: '' } });

    await useSiteStore.getState().load();

    expect(document.title).toBe('魔方 React');
    expect(document.head.querySelector('link[rel="icon"]')).toBeNull();
  });
});
