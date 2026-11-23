/**
 * ListPagination 分页单元测试
 *
 * 覆盖：总数展示（共 N 条）、页码切换触发 onChange。
 */
import { describe, expect, it, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import ListPagination from '../ListPagination';

describe('ListPagination 分页', () => {
  it('展示总数（共 N 条）', () => {
    render(<ListPagination total={123} current={1} pageSize={20} />);
    expect(screen.getByText(/共\s*123\s*条/)).toBeInTheDocument();
  });

  it('页码跳转触发 onChange', () => {
    const onChange = vi.fn();
    render(<ListPagination total={100} current={1} pageSize={10} onChange={onChange} />);
    // 点击第 2 页（antd 6 的点击处理挂在内层链接上）
    fireEvent.click(screen.getByTitle('2').querySelector('a')!);
    expect(onChange).toHaveBeenCalledWith(2, 10);
  });
});
