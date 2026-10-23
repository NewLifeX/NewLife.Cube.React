/**
 * useSiteConfig 单元测试（/Cube/Site 站点配置加载）
 *
 * 覆盖：
 * - 正常返回站点品牌配置
 * - 把租户标识透传给站点接口
 * - 接口失败时不阻塞登录页（配置为空，错误信息可读）
 */
import { describe, expect, it, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { useSiteConfig } from '@/hooks/useSiteConfig';
import type { ApiResponse, SiteConfig } from '@newlifex/api-core';

const { mockGetSite } = vi.hoisted(() => ({
  mockGetSite: vi.fn(),
}));

vi.mock('@/api', () => ({
  api: { site: { getSite: mockGetSite } },
}));

function ok(data: SiteConfig): ApiResponse<SiteConfig> {
  return { code: 0, data };
}

describe('useSiteConfig 站点配置加载', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('加载站点品牌配置', async () => {
    mockGetSite.mockResolvedValue(ok({ name: 'Acme', logo: '/logo.png', copyright: '© Acme' }));

    const { result } = renderHook(() => useSiteConfig());
    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.config?.name).toBe('Acme');
    expect(result.current.config?.logo).toBe('/logo.png');
    expect(result.current.error).toBe('');
  });

  it('把租户标识透传给站点接口', async () => {
    mockGetSite.mockResolvedValue(ok({ name: 'Acme', tenantCode: 'acme' }));

    const { result } = renderHook(() => useSiteConfig('acme'));
    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(mockGetSite).toHaveBeenCalledWith('acme');
    expect(result.current.config?.tenantCode).toBe('acme');
  });

  it('接口失败时返回空配置且不阻塞登录页', async () => {
    mockGetSite.mockRejectedValue(new Error('network error'));

    const { result } = renderHook(() => useSiteConfig());
    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.config).toBeNull();
    expect(result.current.error).toBe('network error');
  });
});
