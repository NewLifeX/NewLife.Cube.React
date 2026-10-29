/**
 * page 动作路径兼容层单元测试（FIX-4 兜底）
 *
 * 覆盖：
 * - withLeadingSlash：缺斜杠补齐、已有斜杠原样
 * - wrapPageActions：getAction/postAction 传入的 type 被补斜杠、参数与返回值透传、
 *   其余 page 方法保持可用（不破坏 spread 后的对象）
 */
import { describe, expect, it, vi } from 'vitest';
import type { CubeApi } from '@newlifex/cube';
import { withLeadingSlash, wrapPageActions } from '../pageActions';

describe('withLeadingSlash', () => {
  it('缺前导斜杠时补齐', () => {
    expect(withLeadingSlash('Admin/Index')).toBe('/Admin/Index');
    expect(withLeadingSlash('Auth/Login')).toBe('/Auth/Login');
  });

  it('已带前导斜杠时原样返回', () => {
    expect(withLeadingSlash('/Admin/Index')).toBe('/Admin/Index');
  });
});

describe('wrapPageActions', () => {
  /** 构造只含 page 成员的最小 CubeApi 假对象 */
  function fakeApi() {
    const getAction = vi.fn().mockResolvedValue({ code: 0, data: { ok: true } });
    const postAction = vi.fn().mockResolvedValue({ code: 0 });
    const getPage = vi.fn();
    const api = { page: { getAction, postAction, getPage } } as unknown as CubeApi;
    return { api, getAction, postAction, getPage };
  }

  it('getAction 的 type 被补齐前导斜杠，参数与返回值透传', async () => {
    const { api, getAction } = fakeApi();
    wrapPageActions(api);

    const res = await api.page.getAction('Admin/Index', 'Dashboard', { a: 1 });

    expect(getAction).toHaveBeenCalledWith('/Admin/Index', 'Dashboard', { a: 1 });
    expect(res).toEqual({ code: 0, data: { ok: true } });
  });

  it('postAction 的 type 被补齐前导斜杠，data 透传', async () => {
    const { api, postAction } = fakeApi();
    wrapPageActions(api);

    await api.page.postAction('Admin/Index', 'SaveWidgetLayout', { Monitor: { sort: 0 } });

    expect(postAction).toHaveBeenCalledWith('/Admin/Index', 'SaveWidgetLayout', { Monitor: { sort: 0 } });
  });

  it('已带斜杠时不会重复添加', async () => {
    const { api, getAction } = fakeApi();
    wrapPageActions(api);

    await api.page.getAction('/Admin/User', 'Index');

    expect(getAction).toHaveBeenCalledWith('/Admin/User', 'Index', undefined);
  });

  it('其余 page 方法原样保留', () => {
    const { api, getPage } = fakeApi();
    wrapPageActions(api);

    expect(api.page.getPage).toBe(getPage);
  });
});
