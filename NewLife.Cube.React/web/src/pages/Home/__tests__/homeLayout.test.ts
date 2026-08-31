/**
 * 工作台布局逻辑单元测试
 *
 * 覆盖：layoutKey camelCase 归一化（后端 Json 输出强制 camelCase）、
 * 统一扁平列表构建（KPI 卡 + 内容部件，KPI span 2 / 部件 span=cols）、
 * 排序（隐藏剔除、未排序项保持构建序）、已隐藏项提取（恢复面板）。
 */
import { describe, expect, it } from 'vitest';
import { buildHomeItems, filterHiddenItems, layoutKey, sortHomeItems } from '../index';
import type { DashboardKpi, DashboardWidget } from '@/hooks/useDashboard';

/** 布局项 */
interface LayoutItem {
  sort?: number;
  hide?: boolean;
}

/** 构造内容部件 */
const widget = (name: string, cols: number, partial: Partial<DashboardWidget> = {}): DashboardWidget => ({
  name,
  title: name,
  cols,
  widgetType: 'Content',
  ...partial,
});

describe('工作台布局 key', () => {
  it('layoutKey：部件名/卡片名统一转首字母小写', () => {
    expect(layoutKey('UserCount')).toBe('userCount');
    expect(layoutKey('MyLogins')).toBe('myLogins');
    expect(layoutKey('Log24h')).toBe('log24h');
    expect(layoutKey('Monitor')).toBe('monitor');
    expect(layoutKey('SysInfo')).toBe('sysInfo');
    expect(layoutKey('LoginLog')).toBe('loginLog');
    expect(layoutKey('QuickLink')).toBe('quickLink');
    expect(layoutKey(undefined)).toBe('');
    expect(layoutKey('')).toBe('');
  });
});

describe('工作台统一布局项构建', () => {
  it('buildHomeItems：KPI 前、内容部件后，KPI span 2、部件 span=cols', () => {
    const kpis: DashboardKpi[] = [
      { name: 'UserCount', label: '用户总数', value: '1' },
      { name: 'MyLogins', label: '我的登录', value: '2' },
    ];
    const widgets = [widget('Monitor', 8), widget('SysInfo', 4), widget('QuickLink', 4)];
    const items = buildHomeItems(kpis, widgets);
    expect(items.map((it) => it.key)).toEqual(['userCount', 'myLogins', 'monitor', 'sysInfo', 'quickLink']);
    expect(items[0].kind).toBe('kpi');
    expect(items[0].cols).toBe(2);
    expect(items[2].kind).toBe('widget');
    expect(items[2].cols).toBe(8);
    expect(items[3].cols).toBe(4);
  });

  it('buildHomeItems：空输入返回空', () => {
    expect(buildHomeItems([], [])).toEqual([]);
  });
});

describe('工作台布局排序与隐藏', () => {
  it('sortHomeItems：KPI 组恒在内容部件前，组内按布局 sort 排', () => {
    const items = buildHomeItems(
      [{ name: 'UserCount', label: '用户总数', value: '1' }],
      [widget('Monitor', 8), widget('SysInfo', 4), widget('QuickLink', 4)],
    );
    const layout: Record<string, LayoutItem> = {
      monitor: { sort: 2 },
      sysInfo: { sort: 1 },
      quickLink: { sort: 0 },
    };
    const rs = sortHomeItems(items, layout);
    // KPI（未排序，保持构建序第 0）恒在最前；内容部件按布局 sort 排
    expect(rs.map((it) => it.key)).toEqual(['userCount', 'quickLink', 'sysInfo', 'monitor']);
  });

  it('sortHomeItems：组内排序，未排序项保持构建序兜底', () => {
    const items = buildHomeItems(
      [{ name: 'UserCount', label: '用户总数', value: '1' }],
      [widget('Monitor', 8), widget('SysInfo', 4), widget('QuickLink', 4)],
    );
    const layout: Record<string, LayoutItem> = { sysInfo: { sort: 0 } };
    const rs = sortHomeItems(items, layout);
    // KPI 前；内容部件：sysInfo（sort=0）先，未排序的 Monitor/QuickLink 保持构建序
    expect(rs.map((it) => it.key)).toEqual(['userCount', 'sysInfo', 'monitor', 'quickLink']);
  });

  it('sortHomeItems：隐藏项剔除（hide=true 不渲染）', () => {
    const items = buildHomeItems([{ name: 'UserCount', label: '用户总数', value: '1' }], [widget('Monitor', 8)]);
    const layout: Record<string, LayoutItem> = { userCount: { hide: true } };
    const rs = sortHomeItems(items, layout);
    expect(rs.map((it) => it.key)).toEqual(['monitor']);
  });

  it('sortHomeItems：无布局时保持构建序', () => {
    const items = buildHomeItems([{ name: 'MyLogins', label: '我的登录', value: '1' }], [widget('SysInfo', 4)]);
    expect(sortHomeItems(items, {}).map((it) => it.key)).toEqual(['myLogins', 'sysInfo']);
  });

  it('filterHiddenItems：提取已隐藏项（KPI + 部件混合）', () => {
    const items = buildHomeItems(
      [{ name: 'UserCount', label: '用户总数', value: '1' }],
      [widget('Monitor', 8), widget('SysInfo', 4)],
    );
    const layout: Record<string, LayoutItem> = { userCount: { hide: true }, sysInfo: { hide: false } };
    const rs = filterHiddenItems(items, layout);
    expect(rs.map((it) => it.key)).toEqual(['userCount']);
    expect(rs[0].kind).toBe('kpi');
  });

  it('filterHiddenItems：无隐藏返回空', () => {
    const items = buildHomeItems([{ name: 'MyLogins', label: '我的登录', value: '1' }], []);
    expect(filterHiddenItems(items, {})).toEqual([]);
  });
});
