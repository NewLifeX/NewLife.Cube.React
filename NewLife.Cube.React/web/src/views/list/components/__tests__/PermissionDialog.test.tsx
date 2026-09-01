/**
 * PermissionDialog 角色权限弹窗组件单测
 *
 * 覆盖：默认折叠仅显示一级菜单、一级菜单快捷级联应用到子孙、
 * 保存提交的权限串含 All(-1) 与级联结果。api.client 以 hoisted mock 隔离网络。
 */
import { describe, expect, it, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { App } from 'antd';
import PermissionDialog from '../PermissionDialog';
import type { PermissionNode } from '@/views/list/utils/permission';

const mocks = vi.hoisted(() => ({
  get: vi.fn(),
  post: vi.fn(),
}));

vi.mock('@/api', () => ({
  api: { client: { get: mocks.get, post: mocks.post } },
}));

/** 三级测试树：一级含子孙、叶子含额外权限位（16 审批） */
const TREE: PermissionNode[] = [
  {
    id: 1,
    name: 'Admin',
    displayName: '系统管理',
    children: [
      {
        id: 11,
        name: 'User',
        displayName: '用户',
        flags: [
          { value: 1, name: '查看' },
          { value: 2, name: '添加' },
          { value: 4, name: '修改' },
          { value: 8, name: '删除' },
        ],
      },
      {
        id: 12,
        name: 'App',
        displayName: '应用',
        children: [
          {
            id: 121,
            name: 'AppLog',
            displayName: '应用日志',
            flags: [
              { value: 1, name: '查看' },
              { value: 16, name: '审批' },
            ],
          },
        ],
      },
    ],
  },
];

function renderDialog() {
  return render(
    <App>
      <PermissionDialog open roleId={1} roleName="测试角色" onClose={() => {}} />
    </App>,
  );
}

/** 点击 antd 树形表格的展开图标 */
function expandRow(name: string) {
  const row = screen.getByText(name).closest('tr')!;
  fireEvent.click(row.querySelector('.ant-table-row-expand-icon')!);
}

describe('PermissionDialog 角色权限弹窗', () => {
  it('默认折叠：仅显示一级菜单，子菜单展开后才可见', async () => {
    mocks.get.mockResolvedValue({ data: { data: { tree: TREE } } });
    renderDialog();

    // 一级菜单可见
    await waitFor(() => expect(screen.getByText('系统管理')).toBeInTheDocument());
    // 子菜单默认不可见（折叠）
    expect(screen.queryByText('用户')).not.toBeInTheDocument();
    expect(screen.queryByText('应用')).not.toBeInTheDocument();
    expect(screen.queryByText('应用日志')).not.toBeInTheDocument();

    // 展开一级菜单后子菜单出现
    expandRow('系统管理');
    expect(screen.getByText('用户')).toBeInTheDocument();
    expect(screen.getByText('应用')).toBeInTheDocument();
  });

  it('一级菜单「只读」级联：子孙菜单仅勾选查看', async () => {
    mocks.get.mockResolvedValue({ data: { data: { tree: TREE } } });
    renderDialog();
    await waitFor(() => expect(screen.getByText('系统管理')).toBeInTheDocument());

    // 点击一级菜单「只读」级联
    fireEvent.click(screen.getByText('只读'));
    // 展开查看子孙：用户/应用日志 均仅「查看」勾选，「添加」「审批」未勾选
    expandRow('系统管理');
    expandRow('应用');
    const userRow = screen.getByText('用户').closest('tr')!;
    expect(userRow.querySelector('input[type=checkbox]')).toBeChecked();
    expect(screen.getByText('应用日志')).toBeInTheDocument();
    const logRow = screen.getByText('应用日志').closest('tr')!;
    expect(logRow.querySelector('input[type=checkbox]')).toBeChecked();
    // 审批复选框未勾选（只读=1，不含 16）
    const logChecks = Array.from(logRow.querySelectorAll('input[type=checkbox]')) as HTMLInputElement[];
    expect(logChecks[1].checked).toBe(false);
  });

  it('一级菜单「全部」级联后保存：提交串含 -1（All 序列化）', async () => {
    mocks.get.mockResolvedValue({ data: { data: { tree: TREE } } });
    mocks.post.mockResolvedValue({ data: { success: true } });
    renderDialog();
    await waitFor(() => expect(screen.getByText('系统管理')).toBeInTheDocument());

    // 一级菜单「全部」级联
    fireEvent.click(screen.getByText('全部'));
    fireEvent.click(screen.getByText('保 存'));
    await waitFor(() => expect(mocks.post).toHaveBeenCalled());

    const payload = mocks.post.mock.calls[0][1] as { roleId: number; permission: string };
    expect(payload.roleId).toBe(1);
    // 子树全部节点：1/11/12/121 均授予 All → 序列化 -1，按 id 升序
    expect(payload.permission).toBe('1#-1,11#-1,12#-1,121#-1');
  });
});
