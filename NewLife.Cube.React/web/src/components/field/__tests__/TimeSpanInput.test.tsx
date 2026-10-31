/**
 * TimeSpanInput 时长输入组件测试
 *
 * 覆盖：按描述单位回显「时:分:秒」、改段回写原始存储值、毫秒精度、禁用态。
 */
import { describe, expect, it, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import TimeSpanInput from '../TimeSpanInput';

/** 取三段数字输入 */
const inputs = () => screen.getAllByRole('spinbutton') as HTMLInputElement[];

describe('TimeSpanInput 时长输入', () => {
  it('按秒拆分为 时:分:秒', () => {
    render(<TimeSpanInput value={22515} description="累计在线总时间，单位秒" />);
    const [h, m, s] = inputs();
    expect(Number(h.value)).toBe(6);
    expect(Number(m.value)).toBe(15);
    expect(Number(s.value)).toBe(15);
  });

  it('空值显示为 0:0:0', () => {
    render(<TimeSpanInput value={null} />);
    expect(inputs().map((el) => Number(el.value))).toEqual([0, 0, 0]);
  });

  it('修改小时后回写新的秒数', () => {
    const onChange = vi.fn();
    render(<TimeSpanInput value={22515} description="单位秒" onChange={onChange} />);
    const [h] = inputs();
    fireEvent.change(h, { target: { value: '8' } });
    fireEvent.blur(h);
    expect(onChange).toHaveBeenCalledWith(8 * 3600 + 15 * 60 + 15);
  });

  it('按描述使用分钟单位换算', () => {
    const onChange = vi.fn();
    render(<TimeSpanInput value={90} description="时长，单位分钟" onChange={onChange} />);
    const [h, m] = inputs();
    expect(Number(h.value)).toBe(1);
    expect(Number(m.value)).toBe(30);

    const [, , s] = inputs();
    fireEvent.change(s, { target: { value: '30' } });
    fireEvent.blur(s);
    // 1 小时 30 分 30 秒 = 90.5 分钟，按整数语义四舍五入为 91 分钟
    expect(onChange).toHaveBeenCalledWith(91);
  });

  it('毫秒单位秒保留 3 位小数', () => {
    render(<TimeSpanInput value={1500} description="耗时，单位毫秒" />);
    const [h, m, s] = inputs();
    expect(Number(h.value)).toBe(0);
    expect(Number(m.value)).toBe(0);
    expect(Number(s.value)).toBe(1.5);
  });

  it('禁用态透传给三段输入', () => {
    render(<TimeSpanInput value={3373} disabled />);
    expect(inputs().every((el) => el.disabled)).toBe(true);
  });
});
