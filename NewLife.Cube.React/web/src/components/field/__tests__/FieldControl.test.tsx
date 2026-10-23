/**
 * FieldControl 字段控件渲染器单元测试
 *
 * 覆盖：input / inputNumber / switch / readonly / email 等控件渲染、
 * 值变更回调、禁用态透传。
 */
import { afterEach, describe, expect, it, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import FieldControl from '../FieldControl';
import { toFieldMeta, type FieldMeta } from '@/types/field';
import { clearFieldRenderers, registerFieldRenderer } from '@/rendering/fieldRenderers';
import type { DataField } from '@newlifex/api-core';

/** 构造字段元数据 */
function f(partial: Partial<DataField>): FieldMeta {
  return toFieldMeta({ name: 'F', typeName: 'String', ...partial });
}

describe('FieldControl 字段控件渲染器', () => {
  it('String 渲染 input 并回填值', () => {
    render(<FieldControl field={f({ name: 'Name' })} value="张三" />);
    expect(screen.getByRole('textbox')).toHaveValue('张三');
  });

  it('email 渲染 type=email 输入框', () => {
    render(<FieldControl field={f({ name: 'Mail', itemType: 'mail' })} />);
    expect(screen.getByRole('textbox')).toHaveAttribute('type', 'email');
  });

  it('Int32 渲染 inputNumber', () => {
    render(<FieldControl field={f({ name: 'Age', typeName: 'Int32' })} />);
    expect(screen.getByRole('spinbutton')).toBeInTheDocument();
  });

  it('Boolean 渲染 switch 且布尔串归一为选中', () => {
    render(<FieldControl field={f({ name: 'Enable', typeName: 'Boolean' })} value="true" />);
    const sw = screen.getByRole('switch');
    expect(sw).toHaveAttribute('aria-checked', 'true');
  });

  it('Guid 渲染 readonly 文本', () => {
    render(<FieldControl field={f({ name: 'Uid', typeName: 'Guid' })} value="abc-123" />);
    expect(screen.getByText('abc-123')).toBeInTheDocument();
    expect(screen.queryByRole('textbox')).not.toBeInTheDocument();
  });

  it('输入变更触发 onChange', () => {
    const onChange = vi.fn();
    render(<FieldControl field={f({ name: 'Name' })} onChange={onChange} />);
    fireEvent.change(screen.getByRole('textbox'), { target: { value: '李四' } });
    expect(onChange).toHaveBeenCalledWith('李四');
  });

  it('disabled 透传到输入控件', () => {
    render(<FieldControl field={f({ name: 'Name' })} disabled />);
    expect(screen.getByRole('textbox')).toBeDisabled();
  });
});

describe('FieldControl 字段级渲染器（META-4）', () => {
  afterEach(() => clearFieldRenderers());

  it('字段声明 view 且已注册时使用自定义渲染器', () => {
    registerFieldRenderer('orgPicker', {
      component: ({ field, value }) => (
        <div data-testid="fc-org" data-name={field.name}>
          {String(value ?? '')}
        </div>
      ),
    });
    render(<FieldControl field={f({ name: 'Org', view: 'orgPicker' })} value="A部门" />);
    expect(screen.getByTestId('fc-org')).toHaveTextContent('A部门');
    expect(screen.getByTestId('fc-org')).toHaveAttribute('data-name', 'Org');
  });

  it('字段声明 view 但未注册时降级内置控件', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    render(<FieldControl field={f({ name: 'Name', view: 'missing' })} value="张三" />);
    expect(screen.getByRole('textbox')).toHaveValue('张三');
    warn.mockRestore();
  });
});
