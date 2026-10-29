/**
 * 地区数据层单元测试（FIX-5 兜底）
 *
 * 覆盖：后端 /Cube/* 瞬时不稳定时的降级策略——
 * - 首次失败（code≠0）→ 300ms 重试一次，成功则正常返回
 * - 连续失败 → 返回空列表（UI 降级，不抛异常）
 * - 首次成功 → 只请求一次
 */
import { describe, expect, it, vi, beforeEach } from 'vitest';

const { mockGet } = vi.hoisted(() => ({ mockGet: vi.fn() }));

vi.mock('@/api', () => ({ api: { client: { get: mockGet } } }));
vi.mock('@/i18n', () => ({ t: (k: string) => k }));

import { fetchChildren, fetchAreaPath } from '../areaData';

describe('areaData 地区接口降级', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('首次 code≠0 时重试一次并返回结果', async () => {
    mockGet
      .mockResolvedValueOnce({ data: { code: 401, message: 'Unauthorized' } })
      .mockResolvedValueOnce({ data: { code: 0, data: [{ ID: 110000, Name: '北京', BigArea: '华北' }] } });

    const list = await fetchChildren(0);

    expect(mockGet).toHaveBeenCalledTimes(2);
    expect(list).toEqual([{ id: 110000, name: '北京', bigArea: '华北', isLeaf: false }]);
  });

  it('连续失败返回空列表且不抛异常', async () => {
    mockGet.mockResolvedValue({ data: { code: 401 } });

    const list = await fetchAreaPath(110000);

    expect(mockGet).toHaveBeenCalledTimes(2);
    expect(list).toEqual([]);
  });

  it('首次成功只请求一次', async () => {
    mockGet.mockResolvedValue({ data: { code: 0, data: [{ id: 110100, name: '北京市' }] } });

    const list = await fetchChildren(110000);

    expect(mockGet).toHaveBeenCalledTimes(1);
    expect(list).toEqual([{ id: 110100, name: '北京市', bigArea: '', isLeaf: false }]);
  });

  it('网络异常同样重试后降级', async () => {
    mockGet.mockRejectedValue(new Error('Network Error'));

    const list = await fetchAreaPath(1);

    expect(mockGet).toHaveBeenCalledTimes(2);
    expect(list).toEqual([]);
  });
});
