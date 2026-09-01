/**
 * AreaCascader 省市区级联选择器单元测试
 *
 * 覆盖：buildAreaTree 路径树构建、挂载加载省级、展开加载市/区、
 * changeOnSelect 选中任意级触发 onChange（值=最后选中编号）、
 * 受控 value 回显（经 AreaParents 解析路径）、value 清除清空路径。
 */
import { describe, expect, it, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import AreaCascader, { buildAreaTree } from '../AreaCascader';
import { api } from '@/api';

const { mockGet } = vi.hoisted(() => ({ mockGet: vi.fn() }));

vi.mock('@/api', () => ({
  api: { client: { get: mockGet } },
  CUBE_TOKEN_EVENT: 'cube:token-change',
}));

const provinces = [
  { id: 1, name: '北京市' },
  { id: 2, name: '广东省' },
];
const cities = [
  { id: 20, name: '广州市' },
  { id: 21, name: '深圳市' },
];
const districts = [{ id: 200, name: '天河区' }];

/** 按请求路径返回地区数据（id=0 省级、id=2 城市、id=20 区县；AreaParents 返回完整父链） */
function setupMock() {
  mockGet.mockReset();
  mockGet.mockImplementation(async (url: unknown, cfg?: { params?: { id?: number } }) => {
    const id = cfg?.params?.id ?? 0;
    if (url === '/Cube/AreaChilds') {
      if (id === 0) return { data: { data: provinces } };
      if (id === 2) return { data: { data: cities } };
      if (id === 20) return { data: { data: districts } };
      return { data: { data: [] } };
    }
    if (url === '/Cube/AreaParents') {
      if (id === 200)
        return {
          data: { data: [{ id: 2, name: '广东省' }, { id: 20, name: '广州市' }, { id: 200, name: '天河区' }] },
        };
      return { data: { data: [] } };
    }
    return { data: { data: [] } };
  });
}

describe('buildAreaTree 路径树构建', () => {
  beforeEach(setupMock);

  it('沿父级路径逐级构建嵌套选项树', async () => {
    const { root, path } = await buildAreaTree([2, 20, 200], 3);
    expect(path).toEqual([2, 20, 200]);
    // 顶层：北京市 / 广东省
    expect(root[1].id).toBe(2);
    // 广东省 → 广州市/深圳市
    expect(root[1].children?.[0].id).toBe(20);
    // 广州市 → 天河区（叶子）
    expect(root[1].children?.[0].children?.[0].id).toBe(200);
    expect(root[1].children?.[0].isLeaf).toBe(false);
    expect(root[1].children?.[0].children?.[0].isLeaf).toBe(true);
  });

  it('超过 maxLevel 的路径被截断', async () => {
    const { path } = await buildAreaTree([2, 20, 200], 2);
    expect(path).toEqual([2, 20]);
  });

  it('路径中节点缺失时中断', async () => {
    const { root, path } = await buildAreaTree([2, 999], 3);
    expect(path).toEqual([2]);
    expect(root[1].children).toEqual([
      { id: 20, name: '广州市', isLeaf: false },
      { id: 21, name: '深圳市', isLeaf: false },
    ]);
  });

  it('兼容 PascalCase 字段（后端旧序列化兜底）', async () => {
    mockGet.mockReset();
    mockGet.mockImplementation(async (url: unknown, cfg?: { params?: { id?: number } }) => {
      const id = cfg?.params?.id ?? 0;
      if (url === '/Cube/AreaChilds') {
        if (id === 0) return { data: { data: [{ ID: 1, Name: '北京市' }, { ID: 2, Name: '广东省' }] } };
        if (id === 2) return { data: { data: [{ ID: 20, Name: '广州市' }] } };
        return { data: { data: [] } };
      }
      return { data: { data: [] } };
    });
    const { root, path } = await buildAreaTree([2, 20], 2);
    expect(path).toEqual([2, 20]);
    expect(root[1].name).toBe('广东省');
    expect(root[1].children?.[0].name).toBe('广州市');
  });
});

describe('AreaCascader 组件', () => {
  beforeEach(setupMock);

  it('挂载后加载省级选项，打开下拉出现省份', async () => {
    render(<AreaCascader maxLevel={3} />);
    fireEvent.mouseDown(screen.getByRole('combobox'));
    await waitFor(() => {
      expect(screen.getByTitle('广东省')).toBeInTheDocument();
      expect(screen.getByTitle('北京市')).toBeInTheDocument();
    });
  });

  it('changeOnSelect 选省触发 onChange（值=省编号）', async () => {
    const onChange = vi.fn();
    render(<AreaCascader maxLevel={3} onChange={onChange} />);
    fireEvent.mouseDown(screen.getByRole('combobox'));
    await waitFor(() => screen.getByTitle('广东省'));
    fireEvent.click(screen.getByTitle('广东省'));
    expect(onChange).toHaveBeenCalledWith(2);
  });

  it('选到区级后 onChange（值=区编号）', async () => {
    const onChange = vi.fn();
    render(<AreaCascader maxLevel={3} onChange={onChange} />);
    fireEvent.mouseDown(screen.getByRole('combobox'));
    await waitFor(() => screen.getByTitle('广东省'));
    fireEvent.click(screen.getByTitle('广东省'));
    // 展开第二级（城市）
    await waitFor(() => screen.getByTitle('广州市'));
    fireEvent.click(screen.getByTitle('广州市'));
    // 展开第三级（区县）
    await waitFor(() => screen.getByTitle('天河区'));
    fireEvent.click(screen.getByTitle('天河区'));
    expect(onChange).toHaveBeenLastCalledWith(200);
  });

  it('受控 value 经 AreaParents 解析路径回显', async () => {
    render(<AreaCascader value={200} maxLevel={3} />);
    fireEvent.mouseDown(screen.getByRole('combobox'));
    // 回显路径末级：天河区
    await waitFor(() => {
      expect(screen.getByTitle('天河区')).toBeInTheDocument();
    });
  });

  it('value 清除后路径清空，不再解析', async () => {
    const { rerender } = render(<AreaCascader value={200} maxLevel={3} />);
    await waitFor(() => {
      expect(mockGet).toHaveBeenCalledWith('/Cube/AreaParents', { params: { id: 200, isContainSelf: true } });
    });
    const calls = mockGet.mock.calls.length;
    rerender(<AreaCascader value={undefined} maxLevel={3} />);
    // 路径已清空：再次打开下拉仍只显示省级（不再解析 200）
    fireEvent.mouseDown(screen.getByRole('combobox'));
    await waitFor(() => screen.getByTitle('广东省'));
    expect(mockGet.mock.calls.length).toBe(calls);
  });
});
