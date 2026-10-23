/**
 * Toolbar 工具栏单元测试
 *
 * 覆盖：权限控制（canAdd/canDelete/canExport/canImport/canChart/canDevelop）、
 * 删除选中仅选中时显示、表格/图表视图切换、高级菜单（导出5格式/导入/删除全部/备份/还原/备份导出/清空数据表、
 * 分隔线分组、开发功能仅 canDevelop 且 清空数据表 无搜索条件时显示）。
 */
import { afterEach, describe, expect, it, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import type { ToolbarItem } from '@newlifex/api-core';
import Toolbar, { buildMetaLinkUrl, buildMetaToolbarPayload } from '../Toolbar';
import { clearToolbarRenderers, registerToolbarRenderer } from '../toolbarRenderers';
import i18n from '@/i18n';

describe('Toolbar 工具栏', () => {
  afterEach(async () => {
    await i18n.changeLanguage('zh-CN');
  });

  it('英文环境下按钮与视图切换使用英文文案', async () => {
    await i18n.changeLanguage('en-US');
    render(<Toolbar canChart />);

    expect(screen.getByText('New')).toBeInTheDocument();
    expect(screen.getByText('Table')).toBeInTheDocument();
    expect(screen.getByText('Chart')).toBeInTheDocument();
  });

  it('默认权限展示新增/刷新/高级，无选中时不显示删除选中，canChart 时显示视图切换', () => {
    render(<Toolbar canChart />);
    expect(screen.getByRole('button', { name: /新\s*增/ })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /刷新/ })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /高\s*级/ })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /删除/ })).not.toBeInTheDocument();
    // 表格/图表视图切换（Segmented）
    expect(screen.getByText('表格')).toBeInTheDocument();
    expect(screen.getByText('图表')).toBeInTheDocument();
  });

  it('canAdd=false 时隐藏新增按钮', () => {
    render(<Toolbar canAdd={false} />);
    expect(screen.queryByRole('button', { name: /新\s*增/ })).not.toBeInTheDocument();
  });

  it('canDelete=false 时隐藏删除选中，高级菜单无删除全部', async () => {
    render(<Toolbar canDelete={false} selectedCount={3} />);
    expect(screen.queryByRole('button', { name: /删除/ })).not.toBeInTheDocument();
    fireEvent.mouseEnter(screen.getByRole('button', { name: /高\s*级/ }));
    await waitFor(() => {
      expect(screen.getByText('导出 Excel')).toBeInTheDocument();
    });
    expect(screen.queryByText('删除全部')).not.toBeInTheDocument();
  });

  it('canExport=false / canImport=false 时高级菜单无导出/导入项', async () => {
    render(<Toolbar canExport={false} canImport={false} />);
    fireEvent.mouseEnter(screen.getByRole('button', { name: /高\s*级/ }));
    await waitFor(() => {
      expect(screen.getByText('删除全部')).toBeInTheDocument();
    });
    expect(screen.queryByText('导出 Excel')).not.toBeInTheDocument();
    expect(screen.queryByText('导入 Excel/Json/Zip')).not.toBeInTheDocument();
  });

  it('canDevelop=false 时高级菜单无备份/还原/备份导出/清空数据表', async () => {
    render(<Toolbar />);
    fireEvent.mouseEnter(screen.getByRole('button', { name: /高\s*级/ }));
    await waitFor(() => {
      expect(screen.getByText('删除全部')).toBeInTheDocument();
    });
    expect(screen.queryByText('备份')).not.toBeInTheDocument();
    expect(screen.queryByText('还原')).not.toBeInTheDocument();
    expect(screen.queryByText('备份导出')).not.toBeInTheDocument();
    expect(screen.queryByText('清空数据表')).not.toBeInTheDocument();
  });

  it('canDevelop=true 时高级菜单含备份/还原/备份导出，无搜索条件时含清空数据表', async () => {
    render(<Toolbar canDevelop />);
    fireEvent.mouseEnter(screen.getByRole('button', { name: /高\s*级/ }));
    await waitFor(() => {
      expect(screen.getByText('备份')).toBeInTheDocument();
      expect(screen.getByText('还原')).toBeInTheDocument();
      expect(screen.getByText('备份导出')).toBeInTheDocument();
      expect(screen.getByText('清空数据表')).toBeInTheDocument();
    });
  });

  it('canDevelop=true 且有搜索条件时隐藏清空数据表，但保留备份/还原/备份导出', async () => {
    render(<Toolbar canDevelop hasSearch />);
    fireEvent.mouseEnter(screen.getByRole('button', { name: /高\s*级/ }));
    await waitFor(() => {
      expect(screen.getByText('备份')).toBeInTheDocument();
    });
    expect(screen.getByText('还原')).toBeInTheDocument();
    expect(screen.getByText('备份导出')).toBeInTheDocument();
    expect(screen.queryByText('清空数据表')).not.toBeInTheDocument();
  });

  it('高级菜单开发功能点击触发 onBackup/onRestore/onBackupExport/onClear', async () => {
    const onBackup = vi.fn();
    const onRestore = vi.fn();
    const onBackupExport = vi.fn();
    const onClear = vi.fn();
    render(<Toolbar canDevelop onBackup={onBackup} onRestore={onRestore} onBackupExport={onBackupExport} onClear={onClear} />);
    fireEvent.mouseEnter(screen.getByRole('button', { name: /高\s*级/ }));
    await waitFor(() => {
      expect(screen.getByText('备份')).toBeInTheDocument();
    });
    fireEvent.click(screen.getByText('备份'));
    await waitFor(() => {
      expect(onBackup).toHaveBeenCalledTimes(1);
    });
    fireEvent.click(screen.getByText('还原'));
    fireEvent.click(screen.getByText('备份导出'));
    fireEvent.click(screen.getByText('清空数据表'));
    await waitFor(() => {
      expect(onRestore).toHaveBeenCalledTimes(1);
      expect(onBackupExport).toHaveBeenCalledTimes(1);
      expect(onClear).toHaveBeenCalledTimes(1);
    });
  });

  it('不同类型菜单之间有分隔线（canDevelop 时 3 条，否则 1 条）', async () => {
    const { unmount } = render(<Toolbar canDevelop />);
    fireEvent.mouseEnter(screen.getByRole('button', { name: /高\s*级/ }));
    await waitFor(() => {
      expect(screen.getByText('备份')).toBeInTheDocument();
    });
    // 导出/导入组 → 删除组 → 开发组 → 清空数据表，共 3 条分隔线
    expect(document.querySelectorAll('.ant-dropdown-menu-item-divider')).toHaveLength(3);
    unmount();

    render(<Toolbar />);
    fireEvent.mouseEnter(screen.getByRole('button', { name: /高\s*级/ }));
    await waitFor(() => {
      expect(screen.getByText('删除全部')).toBeInTheDocument();
    });
    // 非开发模式仅 导出/导入组 → 删除组，1 条分隔线
    expect(document.querySelectorAll('.ant-dropdown-menu-item-divider')).toHaveLength(1);
  });

  it('选中行时显示删除选中并带数量，确认后触发 onDelete', async () => {
    const onDelete = vi.fn();
    render(<Toolbar selectedCount={3} onDelete={onDelete} />);
    expect(screen.getByRole('button', { name: /删除选中\s*\(3\)/ })).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: /删除选中\s*\(3\)/ }));
    await waitFor(() => {
      expect(screen.getByText('确定删除选中的 3 条数据吗？')).toBeInTheDocument();
    });
    // Popconfirm 确认按钮渲染在 portal（.ant-popover）内
    const okBtn = screen.getAllByRole('button', { name: /删\s*除/ }).find((el) => el.closest('.ant-popover'));
    expect(okBtn).toBeTruthy();
    fireEvent.click(okBtn!);
    await waitFor(() => {
      expect(onDelete).toHaveBeenCalledTimes(1);
    });
  });

  it('高级菜单包含全部 5 种导出格式，点击触发 onExport', async () => {
    const onExport = vi.fn();
    render(<Toolbar onExport={onExport} />);
    // antd Dropdown 默认 hover 触发，jsdom 用 mouseEnter 打开
    fireEvent.mouseEnter(screen.getByRole('button', { name: /高\s*级/ }));
    await waitFor(() => {
      expect(screen.getByText('导出 Excel')).toBeInTheDocument();
      expect(screen.getByText('导出 CSV')).toBeInTheDocument();
      expect(screen.getByText('导出 JSON')).toBeInTheDocument();
      expect(screen.getByText('导出 XML')).toBeInTheDocument();
      expect(screen.getByText('导出 Zip')).toBeInTheDocument();
    });
    fireEvent.click(screen.getByText('导出 CSV'));
    await waitFor(() => {
      expect(onExport).toHaveBeenCalledWith('Csv');
    });
  });

  it('高级菜单导入触发 onImport', async () => {
    const onImport = vi.fn();
    render(<Toolbar onImport={onImport} />);
    fireEvent.mouseEnter(screen.getByRole('button', { name: /高\s*级/ }));
    await waitFor(() => {
      expect(screen.getByText('导入 Excel/Json/Zip')).toBeInTheDocument();
    });
    fireEvent.click(screen.getByText('导入 Excel/Json/Zip'));
    await waitFor(() => {
      expect(onImport).toHaveBeenCalledTimes(1);
    });
  });

  it('高级菜单删除全部触发 onDeleteAll', async () => {
    const onDeleteAll = vi.fn();
    render(<Toolbar onDeleteAll={onDeleteAll} />);
    fireEvent.mouseEnter(screen.getByRole('button', { name: /高\s*级/ }));
    await waitFor(() => {
      expect(screen.getByText('删除全部')).toBeInTheDocument();
    });
    fireEvent.click(screen.getByText('删除全部'));
    await waitFor(() => {
      expect(onDeleteAll).toHaveBeenCalledTimes(1);
    });
  });

  it('canChart=false 时不显示表格/图表视图切换', () => {
    render(<Toolbar canChart={false} />);
    expect(screen.queryByText('图表')).not.toBeInTheDocument();
  });

  it('切换视图触发 onViewChange', async () => {
    const onViewChange = vi.fn();
    render(<Toolbar canChart onViewChange={onViewChange} />);
    fireEvent.click(screen.getByText('图表'));
    await waitFor(() => {
      expect(onViewChange).toHaveBeenCalledWith('chart');
    });
  });

  it('新增按钮点击触发 onNew', () => {
    const onNew = vi.fn();
    render(<Toolbar onNew={onNew} />);
    fireEvent.click(screen.getByRole('button', { name: /新\s*增/ }));
    expect(onNew).toHaveBeenCalledTimes(1);
  });
});

describe('Toolbar meta.toolbar 自定义按钮（LIST-14）', () => {
  afterEach(() => clearToolbarRenderers());

  const linkItem: ToolbarItem = {
    name: 'Map',
    displayName: '地图',
    kind: 'link',
    url: '/Base/Org/Map',
    appendQuery: true,
    target: '_blank',
  };
  const requestItem: ToolbarItem = {
    name: 'Refresh',
    displayName: '批量刷新',
    kind: 'request',
    action: 'Refresh',
    method: 'POST',
    include: ['keys', 'q'],
  };
  const uploadItem: ToolbarItem = {
    name: 'Import',
    displayName: '导入',
    kind: 'upload',
    action: 'ImportExcel',
    accept: '.xlsx',
  };

  it('buildMetaToolbarPayload 按 include 取选中主键与查询参数', () => {
    expect(buildMetaToolbarPayload(requestItem, { selectedKeys: [1, 2], pageQuery: { q: 'x' } })).toEqual({
      keys: '1,2',
      q: 'x',
    });
    // include 默认 ["keys"]（呈现架构 §5）
    expect(buildMetaToolbarPayload({ ...requestItem, include: undefined }, { selectedKeys: [3] })).toEqual({
      keys: '3',
    });
    expect(buildMetaToolbarPayload({ ...requestItem, include: undefined }, { selectedKeys: [] })).toEqual({
      keys: '',
    });
  });

  it('buildMetaLinkUrl appendQuery 附加当前查询参数', () => {
    expect(buildMetaLinkUrl(linkItem, { q: 'a', success: false })).toBe('/Base/Org/Map?q=a&success=false');
    expect(buildMetaLinkUrl({ ...linkItem, appendQuery: false }, { q: 'a' })).toBe('/Base/Org/Map');
  });

  it('link 按钮渲染 href 与 target', () => {
    render(<Toolbar metaToolbar={[linkItem]} pageQuery={{ q: 'a' }} />);
    // antd 两字按钮自动加空格（地图 → 地 图）
    const link = screen.getByRole('link', { name: /地\s*图/ });
    expect(link).toHaveAttribute('href', '/Base/Org/Map?q=a');
    expect(link).toHaveAttribute('target', '_blank');
  });

  it('request 按钮未选中时禁用，选中后提交 include 载荷', async () => {
    const onMetaAction = vi.fn();
    const { rerender } = render(<Toolbar metaToolbar={[requestItem]} selectedKeys={[]} onMetaAction={onMetaAction} />);
    expect(screen.getByRole('button', { name: '批量刷新' })).toBeDisabled();

    rerender(<Toolbar metaToolbar={[requestItem]} selectedKeys={[7]} pageQuery={{ q: 'x' }} onMetaAction={onMetaAction} />);
    const button = screen.getByRole('button', { name: '批量刷新' });
    expect(button).not.toBeDisabled();
    fireEvent.click(button);
    await waitFor(() =>
      expect(onMetaAction).toHaveBeenCalledWith(requestItem, { keys: '7', q: 'x' }),
    );
  });

  it('upload 按钮渲染隐藏文件框并带 accept', () => {
    const { container } = render(<Toolbar metaToolbar={[uploadItem]} />);
    const input = container.querySelector('input[type="file"]') as HTMLInputElement;
    expect(input).toBeTruthy();
    expect(input.accept).toBe('.xlsx');
  });

  it('custom 按钮未注册渲染器时跳过（不报错）', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const { container } = render(
      <Toolbar metaToolbar={[{ name: 'Adv', displayName: '高级导入', kind: 'custom', renderer: 'missing' }]} />,
    );
    expect(container.textContent).not.toContain('高级导入');
    warn.mockRestore();
  });

  it('custom 按钮已注册时渲染自定义组件', () => {
    registerToolbarRenderer('adv', {
      component: ({ item }) => <button type="button">{item.displayName}</button>,
    });
    render(<Toolbar metaToolbar={[{ name: 'Adv', displayName: '高级导入', kind: 'custom', renderer: 'adv' }]} />);
    expect(screen.getByRole('button', { name: '高级导入' })).toBeInTheDocument();
  });
});
