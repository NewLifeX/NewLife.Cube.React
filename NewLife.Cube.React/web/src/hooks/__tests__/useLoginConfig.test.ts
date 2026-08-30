/**
 * useLoginConfig 单元测试（登录配置加载 + OAuth 字段归一化）
 *
 * 覆盖：
 * - 后端返回 oAuth 字段（.NET camelCase 序列化变体）→ 归一化为 oauth，登录页可读到第三方登录
 * - 后端返回标准 oauth 字段 → 原样保留
 * - 后端返回 v1 旧字段 providers → 归一化为 oauth
 * - 无 OAuth 数据 → oauth 为空（登录页读取 `config?.oauth ?? []` 为空数组，区块不显示）
 * - 接口失败 → error 提示，loading 结束，config 为空
 */
import { describe, expect, it, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { useLoginConfig } from '@/hooks/useLoginConfig';
import type { ApiResponse, LoginConfig } from '@newlifex/api-core';

// ── 模块 Mock：拦截 api.user.getLoginConfig（vi.hoisted 保证 hoist 安全）──
const { mockGetLoginConfig } = vi.hoisted(() => ({
  mockGetLoginConfig: vi.fn(),
}));

vi.mock('@/api', () => ({
  api: { user: { getLoginConfig: mockGetLoginConfig } },
}));

/** 后端 OAuth 提供商样例（对齐实测 /Auth/LoginConfig 返回） */
const provider = { name: 'NewLife', logo: '/Content/images/logo/NewLife.png', nickName: '新生命用户中心' };

/**
 * 构造成功响应。后端 oAuth 字段不在 LoginConfig 类型内，用 Record 透传后断言
 * @param data 原始配置（可能含 oAuth 等非标准字段）
 */
function ok(data: Record<string, unknown>): ApiResponse<LoginConfig> {
  return { code: 0, data: data as unknown as LoginConfig };
}

describe('useLoginConfig 登录配置加载', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('后端返回 oAuth 字段（camelCase 变体）时归一化为 oauth', async () => {
    mockGetLoginConfig.mockResolvedValue(ok({ name: '魔方', oAuth: [provider] }));

    const { result } = renderHook(() => useLoginConfig());
    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.config?.oauth).toEqual([provider]);
    expect(result.current.error).toBe('');
  });

  it('后端返回标准 oauth 字段时原样保留', async () => {
    mockGetLoginConfig.mockResolvedValue(ok({ name: '魔方', oauth: [provider] }));

    const { result } = renderHook(() => useLoginConfig());
    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.config?.oauth).toEqual([provider]);
  });

  it('后端返回 v1 旧字段 providers 时归一化为 oauth', async () => {
    mockGetLoginConfig.mockResolvedValue(ok({ name: '魔方', providers: [provider] }));

    const { result } = renderHook(() => useLoginConfig());
    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.config?.oauth).toEqual([provider]);
  });

  it('无 OAuth 数据时 oauth 为空（登录页第三方登录区块不显示）', async () => {
    mockGetLoginConfig.mockResolvedValue(ok({ name: '魔方', login: { password: true } }));

    const { result } = renderHook(() => useLoginConfig());
    await waitFor(() => expect(result.current.loading).toBe(false));

    // 登录页读取逻辑：oauthProviders = config?.oauth ?? []
    expect(result.current.config?.oauth ?? []).toEqual([]);
  });

  it('接口失败时设置 error 提示且 config 为空', async () => {
    mockGetLoginConfig.mockRejectedValue(new Error('network error'));

    const { result } = renderHook(() => useLoginConfig());
    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.error).toBe('登录配置加载失败');
    expect(result.current.config).toBeNull();
  });
});
