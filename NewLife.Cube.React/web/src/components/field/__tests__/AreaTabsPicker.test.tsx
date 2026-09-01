/**
 * AreaTabsPicker 多 Tab 弹层选择器单元测试
 *
 * 覆盖：省份按大区分组、选省自动切城市 tab 并加载市、选市/区触发 onChange（最后 ID）、
 * 受控 value 回显（AreaParents 解析路径 + 输入显示路径）、清除。
 * 数据 mock 走 /Cube/AreaChilds、/Cube/AreaParents（camelCase，含 bigArea）。
 * jsdom 下 matchMedia 全 false → md=false → 走 Drawer（移动端）分支。
 */
import { describe, expect, it, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import AreaTabsPicker from '../AreaTabsPicker';
import { api } from '@/api';

const { mockGet } = vi.hoisted(() => ({ mockGet: vi.fn() }));

vi.mock('@/api', () => ({
  api: { client: { get: mockGet } },
  CUBE_TOKEN_EVENT: 'cube:token-change',
}));

const provinces = [
  { id: 1, name: '北京', bigArea: '华北' },
  { id: 2, name: '天津', bigArea: '华北' },
  { id: 3, name: '广东', bigArea: '华南' },
  { id: 4, name: '广西', bigArea: '华南' },
];
const cities = [
  { id: 30, name: '广州', bigArea: '华南' },
  { id: 31, name: '深圳', bigArea: '华南' },
];
const districts = [{ id: 300, name: '天河区' }];

/** 按请求路径返回地区数据（id=0 省级、id=3 城市、id=30 区县；AreaParents 返回完整父链） */
function setupMock() {
  mockGet.mockReset();
  mockGet.mockImplementation(async (url: unknown, cfg?: { params?: { id?: number } }) => {
    const id = cfg?.params?.id ?? 0;
    if (url === '/Cube/AreaChilds') {
      if (id === 0) return { data: { data: provinces } };
      if (id === 3) return { data: { data: cities } };
      if (id === 30) return { data: { data: districts } };
      return { data: { data: [] } };
    }
    if (url === '/Cube/AreaParents') {
      if (id === 300)
        return {
          data: {
            data: [
              { id: 3, name: '广东', level: 1 },
              { id: 30, name: '广州', level: 2 },
              { id: 300, name: '天河区', level: 3 },
            ],
          },
        };
      return { data: { data: [] } };
    }
    return { data: { data: [] } };
  });
}

/** 打开面板（点击输入框） */
async function openPanel() {
  fireEvent.click(screen.getByRole('textbox'));
  await waitFor(() => expect(screen.getByTestId('area-tabs-panel')).toBeInTheDocument());
}

describe('AreaTabsPicker 多Tab弹层', () => {
  beforeEach(setupMock);

  it('省份 tab 按大区分组展示', async () => {
    render(<AreaTabsPicker maxLevel={3} />);
    await openPanel();
    // tab 栏：省份/城市/区县
    expect(screen.getByTestId('area-tabs-nav-0')).toHaveTextContent('省份');
    expect(screen.getByTestId('area-tabs-nav-1')).toHaveTextContent('城市');
    expect(screen.getByTestId('area-tabs-nav-2')).toHaveTextContent('区县');
    // 大区分组标题 + 省份
    const groups = screen.getAllByTestId('area-tabs-group');
    expect(groups.length).toBeGreaterThanOrEqual(2);
    expect(screen.getByText('华北')).toBeInTheDocument();
    expect(screen.getByText('华南')).toBeInTheDocument();
    expect(screen.getByText('广东')).toBeInTheDocument();
    expect(screen.getByText('北京')).toBeInTheDocument();
  });

  it('选省自动切城市 tab 并加载市，选市切区县，选区触发 onChange（最后ID）', async () => {
    const onChange = vi.fn();
    render(<AreaTabsPicker maxLevel={3} onChange={onChange} />);
    await openPanel();
    fireEvent.click(screen.getByText('广东'));
    // 自动切到城市 tab，加载广州/深圳
    await waitFor(() => expect(screen.getByText('广州')).toBeInTheDocument());
    fireEvent.click(screen.getByText('广州'));
    // 区县 tab 出现天河区
    await waitFor(() => expect(screen.getByText('天河区')).toBeInTheDocument());
    fireEvent.click(screen.getByText('天河区'));
    expect(onChange).toHaveBeenCalledWith(300);
  });

  it('maxLevel=2 时选市即选中完成', async () => {
    const onChange = vi.fn();
    render(<AreaTabsPicker maxLevel={2} onChange={onChange} />);
    await openPanel();
    fireEvent.click(screen.getByText('广东'));
    await waitFor(() => expect(screen.getByText('广州')).toBeInTheDocument());
    fireEvent.click(screen.getByText('广州'));
    expect(onChange).toHaveBeenCalledWith(30);
  });

  it('受控 value 经 AreaParents 解析路径回显', async () => {
    render(<AreaTabsPicker value={300} maxLevel={3} />);
    await openPanel();
    // 回显路径显示在输入框：广东 / 广州 / 天河区
    await waitFor(() => expect(screen.getByText('天河区')).toBeInTheDocument());
    const input = screen.getByRole('textbox') as HTMLInputElement;
    expect(input.value).toContain('广东');
    expect(input.value).toContain('广州');
    expect(input.value).toContain('天河区');
  });

  it('value 清除后路径清空', async () => {
    const { rerender } = render(<AreaTabsPicker value={300} maxLevel={3} />);
    await waitFor(() => expect((screen.getByRole('textbox') as HTMLInputElement).value).toContain('天河区'));
    rerender(<AreaTabsPicker value={undefined} maxLevel={3} />);
    const input = screen.getByRole('textbox') as HTMLInputElement;
    expect(input.value).toBe('');
  });
});
