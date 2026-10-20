/**
 * Toolbar 工具栏单元测试
 *
 * 覆盖：权限控制（canAdd/canDelete/canExport/canImport/canChart/canDevelop）、
 * 删除选中仅选中时显示、表格/图表视图切换、高级菜单（导出5格式/导入/删除全部/备份/还原/备份导出/清空数据表、
 * 分隔线分组、开发功能仅 canDevelop 且 清空数据表 无搜索条件时显示）。
 */
import { afterEach, describe, expect, it, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import Toolbar from '../Toolbar';
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
