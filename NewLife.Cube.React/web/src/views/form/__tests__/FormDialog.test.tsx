/**
 * FormDialog 表单弹窗单元测试
 *
 * 覆盖：按字段 Category 决定是否分组——有分类渲染 Tabs 标签页，
 * 全部无分类保持平铺；编辑模式行数据回填不受分组影响。
 *
 * 注：FieldControl 不透传 id，Form.Item 标签无法用 getByLabelText 关联定位，
 * 因此用 role/displayValue 等不依赖 label-for 关联的查询。
 */
import { describe, expect, it } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import FormDialog from '../FormDialog';
import type { DataField } from '@newlifex/api-core';
import type { FieldMapping } from '@newlifex/field-mapping';

/** 构造字段映射（widget 固定 text，按字段元数据驱动渲染） */
function mapping(name: string, partial: Partial<DataField> = {}): FieldMapping {
  return { widget: 'text', field: { name, typeName: 'String', ...partial } };
}

describe('FormDialog 表单弹窗', () => {
  it('字段带 Category → auto 模式渲染分区区块（不强制 Tabs）', () => {
    render(
      <FormDialog
        open
        mode="add"
        fields={[
          mapping('Name', { category: '基本信息' }),
          mapping('Secret', { category: '扩展' }),
          mapping('Remark'),
        ]}
      />,
    );
    // 2~3 个分类 → 分区区块；分类标题直接可见，无 tab 角色
    expect(screen.queryByRole('tab')).not.toBeInTheDocument();
    expect(screen.getByText('基本信息')).toBeInTheDocument();
    expect(screen.getByText('扩展')).toBeInTheDocument();
    expect(screen.getByText('常规设置')).toBeInTheDocument();
    expect(screen.getByText('Name')).toBeInTheDocument();
  });

  it('preset.form.groupBy=tabs 时按分类渲染 Tabs 标签页', () => {
    render(
      <FormDialog
        open
        mode="add"
        fields={[
          mapping('Name', { category: '基本信息' }),
          mapping('Secret', { category: '扩展' }),
          mapping('Remark'),
        ]}
        formPreset={{ groupBy: 'tabs' }}
      />,
    );
    expect(screen.getByRole('tab', { name: '基本信息' })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: '扩展' })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: '常规设置' })).toBeInTheDocument();
    expect(screen.getByText('Name')).toBeInTheDocument();
  });

  it('字段全部无 Category → 平铺渲染，无 Tabs', () => {
    render(
      <FormDialog
        open
        mode="add"
        fields={[mapping('Name'), mapping('Mail', { itemType: 'mail' })]}
      />,
    );
    expect(screen.queryByRole('tab')).not.toBeInTheDocument();
    expect(screen.getByText('Name')).toBeInTheDocument();
    expect(screen.getByText('Mail')).toBeInTheDocument();
    expect(screen.getAllByRole('textbox')).toHaveLength(2);
  });

  it('编辑模式回填行数据，分组不影响取值', () => {
    render(
      <FormDialog
        open
        mode="edit"
        fields={[mapping('Name', { category: '基本信息' }), mapping('Enable', { category: '基本信息', typeName: 'Boolean' })]}
        row={{ Name: '张三', Enable: 'true' }}
      />,
    );
    expect(screen.getByDisplayValue('张三')).toBeInTheDocument();
  });

  it('编辑模式回填 camelCase 行数据（后端实体 JSON 大小写）', () => {
    // 回归：后端列表/详情接口返回 camelCase（{id,name,displayName,...}），
    // 而字段名为 PascalCase，直接 setFieldsValue 会全部落空（旧版编辑看不到数据）
    const { unmount } = render(
      <FormDialog
        open
        mode="edit"
        fields={[
          mapping('Name', { category: '基本信息' }),
          mapping('DisplayName', { category: '基本信息' }),
          mapping('Enable', { category: '基本信息', typeName: 'Boolean' }),
        ]}
        row={{ id: 2, name: 'Stone', displayName: '石头', enable: 'true' }}
      />,
    );
    expect(screen.getByDisplayValue('Stone')).toBeInTheDocument();
    expect(screen.getByDisplayValue('石头')).toBeInTheDocument();
    // 布尔串归一为开关开启
    expect(screen.getByRole('switch')).toBeChecked();
    // 显式卸载，清理 Modal 内部延迟计时器（避免全量跑时 unhandled error）
    unmount();
  });

  it('编辑模式提交模型携带主键', async () => {
    let submitted: Record<string, unknown> | null = null;
    const { unmount } = render(
      <FormDialog
        open
        mode="edit"
        fields={[mapping('ID', { primaryKey: true }), mapping('Name')]}
        row={{ id: 7, name: 'Stone' }}
        onSubmit={async (data) => {
          submitted = data;
        }}
      />,
    );
    fireEvent.change(screen.getAllByRole('textbox')[0], { target: { value: '新名' } });
    fireEvent.click(screen.getByRole('button', { name: /保\s*存/ }));
    await waitFor(() => {
      expect(submitted).toEqual({ Name: '新名', ID: 7 });
    });
    // 显式卸载，清理 Modal 内部延迟计时器（避免全量跑时 unhandled error）
    unmount();
  });

  it('保存触发 onSubmit 并携带表单值', async () => {
    let submitted: Record<string, unknown> | null = null;
    render(
      <FormDialog
        open
        mode="add"
        fields={[mapping('Name', { category: '基本信息' }), mapping('Secret', { category: '扩展' })]}
        onSubmit={async (data) => {
          submitted = data;
        }}
      />,
    );
    fireEvent.change(screen.getAllByRole('textbox')[0], { target: { value: '李四' } });
    fireEvent.click(screen.getByRole('button', { name: /保\s*存/ }));
    // onSubmit 为异步，等待完成后再断言
    await waitFor(() => {
      expect(submitted).toEqual({ Name: '李四' });
    });
  });

  it('字段带 Description → 同排展示裁剪后的描述', () => {
    render(
      <FormDialog
        open
        mode="add"
        fields={[mapping('Name', { displayName: '名称', description: '名称。实体名称' })]}
      />,
    );
    // 标签与裁剪后的描述同排展示（描述带 title 悬浮完整）
    expect(screen.getByText('名称')).toBeInTheDocument();
    expect(screen.getByText('实体名称')).toBeInTheDocument();
    expect(screen.getByTitle('实体名称')).toBeInTheDocument();
  });

  it('Description 与 DisplayName 相同 → 不渲染描述列', () => {
    render(
      <FormDialog
        open
        mode="add"
        fields={[mapping('Name', { displayName: '名称', description: '名称' })]}
      />,
    );
    // 仅标签一个「名称」，裁剪后为空串的描述不展示
    expect(screen.getAllByText('名称')).toHaveLength(1);
  });
});
