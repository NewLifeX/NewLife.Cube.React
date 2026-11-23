/**
 * 用户详情页单测
 *
 * 覆盖：页头摘要、7 个 Tab、Tab 深链、关联 Tab 嵌入原列表页并按 userId 过滤、详情 404。
 */
import { describe, expect, it, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import UserDetailPage from '../UserDetailPage';

const apiMocks = vi.hoisted(() => ({
  getPage: vi.fn(),
  getDetail: vi.fn(),
  getList: vi.fn(),
  getChartData: vi.fn(),
}));

vi.mock('@/api', () => ({
  api: { page: apiMocks },
}));

const USER_META = {
  detail: [
    { name: 'Id', typeName: 'Int32', displayName: '编号' },
    { name: 'DisplayName', typeName: 'String', displayName: '昵称' },
    { name: 'Name', typeName: 'String', displayName: '名称' },
    { name: 'Enable', typeName: 'Boolean', displayName: '启用' },
    { name: 'RoleNames', typeName: 'String', displayName: '角色组' },
    { name: 'Logins', typeName: 'Int32', displayName: '登录次数' },
    { name: 'LastLogin', typeName: 'DateTime', displayName: '最后登录' },
    { name: 'RegisterTime', typeName: 'DateTime', displayName: '注册时间' },
    { name: 'OnlineTime', typeName: 'Int32', itemType: 'TimeSpan', displayName: '在线时间' },
  ],
  list: [],
  ui: null,
};

const USER_DETAIL = {
  Id: 7,
  DisplayName: '张三',
  Name: 'zhangsan',
  Enable: true,
  Online: true,
  RoleNames: '管理员',
  DepartmentName: '研发部',
  Logins: 12,
  LastLogin: '2026-11-01T10:00:00',
  RegisterTime: '2026-01-01T00:00:00',
  OnlineTime: 3600,
};

const RELATION_META = {
  setting: { enableAdd: false, isReadOnly: true },
  list: [
    { name: 'Id', typeName: 'Int32', primaryKey: true, displayName: '编号' },
    { name: 'Provider', typeName: 'String', displayName: '提供商' },
    { name: 'OpenId', typeName: 'String', displayName: '身份标识' },
  ],
};

/** 渲染详情页 */
function renderPage(entry = '/Admin/User/Detail/7?tab=tokens') {
  return render(
    <MemoryRouter initialEntries={[entry]}>
      <Routes>
        <Route path="/Admin/User/Detail/:id" element={<UserDetailPage />} />
      </Routes>
    </MemoryRouter>,
  );
}

describe('UserDetailPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    apiMocks.getPage.mockImplementation((type: string) =>
      Promise.resolve({
        code: 0,
        data: type === '/Admin/User' ? USER_META : RELATION_META,
      }),
    );
    apiMocks.getDetail.mockResolvedValue({ code: 0, data: USER_DETAIL });
    apiMocks.getList.mockResolvedValue({
      code: 0,
      data: [{ Id: 1, Provider: 'Github', OpenId: 'abcdefghijklmnop' }],
      page: { pageIndex: 1, pageSize: 20, totalCount: 1 },
    });
    apiMocks.getChartData.mockResolvedValue({ code: 0, data: [] });
  });

  it('渲染用户摘要、统计与 7 个 Tab', async () => {
    renderPage();

    expect(await screen.findByText('张三')).toBeInTheDocument();
    expect(screen.getByText('@zhangsan')).toBeInTheDocument();
    expect(screen.getByText('管理员')).toBeInTheDocument();
    expect(screen.getByText('研发部')).toBeInTheDocument();
    expect(screen.getByText('12')).toBeInTheDocument();

    for (const label of ['基本信息', '第三方授权', '令牌', '在线会话', '操作日志', 'OAuth 日志', '通知记录']) {
      expect(screen.getByText(label)).toBeInTheDocument();
    }
  });

  it('?tab=tokens 深链嵌入原列表页，按 userId 过滤且不把 tab 当查询条件', async () => {
    renderPage();

    expect(await screen.findByText('张三')).toBeInTheDocument();
    expect(await screen.findByRole('columnheader', { name: '提供商' })).toBeInTheDocument();

    expect(apiMocks.getPage).toHaveBeenCalledWith('/Admin/UserToken');
    expect(apiMocks.getList).toHaveBeenCalledWith(
      '/Admin/UserToken',
      expect.objectContaining({ userId: '7' }),
    );
    expect(apiMocks.getList.mock.calls[0][1]).not.toHaveProperty('tab');
  });

  it('Tab 标题显示该维度总条数', async () => {
    const { container } = renderPage();

    expect(await screen.findByText('张三')).toBeInTheDocument();
    expect(await screen.findByRole('columnheader', { name: '提供商' })).toBeInTheDocument();
    expect(container.querySelector('.cube-user-detail-count')?.textContent).toBe('1');
  });

  it('详情 404 时展示用户不存在', async () => {
    apiMocks.getDetail.mockRejectedValueOnce({ response: { status: 404 } });
    renderPage('/Admin/User/Detail/999');

    expect(await screen.findByText('用户不存在')).toBeInTheDocument();
  });
});
