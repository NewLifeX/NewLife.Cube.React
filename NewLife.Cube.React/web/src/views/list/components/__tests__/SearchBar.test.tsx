/**
 * SearchBar 搜索栏单元测试
 *
 * 覆盖：按字段渲染搜索控件、输入后搜索触发 onSearch 且携带清理后参数、
 * 重置触发 onReset 并清空输入。
 */
import { describe, expect, it, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import SearchBar, { splitSearchFields } from '../SearchBar';
import type { FieldMapping } from '@newlifex/field-mapping';

/** 构造搜索字段 */
function textField(name: string, displayName: string): FieldMapping {
  return { widget: 'text', field: { name, typeName: 'String', displayName } };
}

function switchField(name: string, displayName: string): FieldMapping {
  return { widget: 'switch', field: { name, typeName: 'Boolean', displayName } };
}

describe('SearchBar 搜索栏', () => {
  it('按字段渲染搜索控件与标签', () => {
    render(<SearchBar fields={[textField('Name', '名称'), switchField('Enable', '启用')]} onSearch={() => {}} onReset={() => {}} />);
    expect(screen.getByText('名称')).toBeInTheDocument();
    expect(screen.getByText('启用')).toBeInTheDocument();
    // antd Button 中文自动插空格（"搜 索"），用空白正则匹配
    expect(screen.getByRole('button', { name: /搜\s*索/ })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /重\s*置/ })).toBeInTheDocument();
  });

  it('空字段列表时不渲染', () => {
    const { container } = render(<SearchBar fields={[]} onSearch={() => {}} onReset={() => {}} />);
    expect(container).toBeEmptyDOMElement();
  });

  it('输入关键词后点搜索，onSearch 收到清理后的参数', () => {
    const onSearch = vi.fn();
    render(<SearchBar fields={[textField('Name', '名称')]} onSearch={onSearch} onReset={() => {}} />);
    fireEvent.change(screen.getByPlaceholderText(/请输入名称/), { target: { value: 'admin' } });
    fireEvent.click(screen.getByRole('button', { name: /搜\s*索/ }));
    expect(onSearch).toHaveBeenCalledWith({ Name: 'admin' });
  });

  it('空输入点搜索不提交空值参数', () => {
    const onSearch = vi.fn();
    render(<SearchBar fields={[textField('Name', '名称')]} onSearch={onSearch} onReset={() => {}} />);
    fireEvent.click(screen.getByRole('button', { name: /搜\s*索/ }));
    expect(onSearch).toHaveBeenCalledWith({});
  });

  it('点重置触发 onReset 并清空输入', () => {
    const onReset = vi.fn();
    render(<SearchBar fields={[textField('Name', '名称')]} onSearch={() => {}} onReset={onReset} />);
    fireEvent.change(screen.getByPlaceholderText(/请输入名称/), { target: { value: 'admin' } });
    fireEvent.click(screen.getByRole('button', { name: /重\s*置/ }));
    expect(onReset).toHaveBeenCalledTimes(1);
    expect(screen.getByPlaceholderText(/请输入名称/)).toHaveValue('');
  });

  it('开关字段渲染是/否下拉', () => {
    render(<SearchBar fields={[switchField('Enable', '启用')]} onSearch={() => {}} onReset={() => {}} />);
    // Select 组件渲染为 combobox
    expect(screen.getByRole('combobox')).toBeInTheDocument();
  });

  it('字段过多时默认折叠，点击展开显示全部', () => {
    const fields = [
      textField('A', '甲'),
      textField('B', '乙'),
      textField('C', '丙'),
      textField('D', '丁'),
    ];
    render(<SearchBar fields={fields} onSearch={() => {}} onReset={() => {}} />);
    // jsdom 下 clientWidth=0 → 1 列 × 2 行，折叠默认只显示前 2 项
    expect(screen.getByText('甲')).toBeInTheDocument();
    expect(screen.getByText('乙')).toBeInTheDocument();
    expect(screen.queryByText('丙')).not.toBeInTheDocument();
    // 展开后全部显示
    fireEvent.click(screen.getByRole('button', { name: /展\s*开/ }));
    expect(screen.getByText('丙')).toBeInTheDocument();
    expect(screen.getByText('丁')).toBeInTheDocument();
    // 可再收起
    fireEvent.click(screen.getByRole('button', { name: /收\s*起/ }));
    expect(screen.queryByText('丙')).not.toBeInTheDocument();
  });
});

describe('SearchBar 查询项语义（LIST-11）', () => {
  /** 关键字查询项（kind=keyword） */
  function keywordField(): FieldMapping {
    return { widget: 'text', field: { name: 'q', displayName: '关键字', typeName: 'String', kind: 'keyword' } };
  }

  /** 区间查询项（kind=range，结束参数 dtEnd） */
  function rangeField(): FieldMapping {
    return {
      widget: 'number',
      field: { name: 'dtStart', displayName: '数量', typeName: 'Int32', kind: 'range', end: 'dtEnd', field: 'CreateTime' },
    };
  }

  it('splitSearchFields 按 kind 拆分关键字/区间/普通', () => {
    const groups = splitSearchFields([keywordField(), textField('Name', '名称'), rangeField()]);
    expect(groups.keyword?.field.name).toBe('q');
    expect(groups.normals.map((x) => x.field.name)).toEqual(['Name']);
    expect(groups.ranges.map((x) => x.field.name)).toEqual(['dtStart']);
  });

  it('关键字占首格并按字段名提交', () => {
    const onSearch = vi.fn();
    render(<SearchBar fields={[textField('Name', '名称'), keywordField()]} onSearch={onSearch} onReset={() => {}} />);
    expect(screen.getByText('关键字')).toBeInTheDocument();
    fireEvent.change(screen.getByPlaceholderText(/请输入关键字/), { target: { value: 'abc' } });
    fireEvent.click(screen.getByRole('button', { name: /搜\s*索/ }));
    expect(onSearch).toHaveBeenCalledWith({ q: 'abc' });
  });

  it('区间项提交 name 与 end 两参（dtStart/dtEnd）', () => {
    const onSearch = vi.fn();
    render(<SearchBar fields={[rangeField()]} onSearch={onSearch} onReset={() => {}} />);
    fireEvent.change(screen.getByPlaceholderText('最小值'), { target: { value: '1' } });
    fireEvent.change(screen.getByPlaceholderText('最大值'), { target: { value: '9' } });
    fireEvent.click(screen.getByRole('button', { name: /搜\s*索/ }));
    expect(onSearch).toHaveBeenCalledWith({ dtStart: 1, dtEnd: 9 });
  });
});
