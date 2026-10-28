/**
 * 工作台布局逻辑单元测试
 *
 * 覆盖：layoutKey camelCase 归一化（后端 Json 输出强制 camelCase）、
 * 统一扁平列表构建（KPI 卡 + 内容部件，KPI span 2 / 部件 span=cols）、
 * 排序（隐藏剔除、未排序项保持构建序）、已隐藏项提取（恢复面板）。
 */
import { describe, expect, it } from 'vitest';
import { buildHomeItems, filterHiddenItems, layoutKey, normalizeLayout, parseHtmlLink, sortHomeItems } from '../index';
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
  data: null,
  ...partial,
});

describe('工作台布局 key', () => {
  it('layoutKey：部件名/卡片名统一转首字母小写', () => {
    expect(layoutKey('UserCount')).toBe('userCount');
    expect(layoutKey('OnlineCount')).toBe('onlineCount');
    expect(layoutKey('MaxOnline')).toBe('maxOnline');
    expect(layoutKey('OnlineTime')).toBe('onlineTime');
    expect(layoutKey('Monitor')).toBe('monitor');
    expect(layoutKey('SysInfo')).toBe('sysInfo');
    expect(layoutKey('LoginLog')).toBe('loginLog');
    expect(layoutKey('QuickLink')).toBe('quickLink');
    expect(layoutKey(undefined)).toBe('');
    expect(layoutKey('')).toBe('');
  });

  it('normalizeLayout：PascalCase/混合大小写 key 统一转 camelCase', () => {
    const raw: Record<string, LayoutItem> = {
      UserCount: { sort: 0, hide: false },
      TodayLogin: { sort: 2 },
      onlineCount: { sort: 1, hide: true },
      Monitor: { sort: 6 },
    };
    const rs = normalizeLayout(raw);
    expect(rs).toEqual({
      userCount: { sort: 0, hide: false },
      todayLogin: { sort: 2 },
      onlineCount: { sort: 1, hide: true },
      monitor: { sort: 6 },
    });
    // 已是 camelCase 的键保持不变
    expect(rs.onlineCount).toEqual({ sort: 1, hide: true });
  });

  it('normalizeLayout：空对象返回空', () => {
    expect(normalizeLayout({})).toEqual({});
  });
});

describe('工作台统一布局项构建', () => {
  it('buildHomeItems：KPI 前、内容部件后，KPI span 2、部件 span=cols', () => {
    const kpis: DashboardKpi[] = [
      { name: 'UserCount', label: '用户总数', value: '1' },
      { name: 'TodayLogin', label: '今日登录', value: '2' },
    ];
    const widgets = [widget('Monitor', 8), widget('SysInfo', 4), widget('QuickLink', 4)];
    const items = buildHomeItems(kpis, widgets);
    expect(items.map((it) => it.key)).toEqual(['userCount', 'todayLogin', 'monitor', 'sysInfo', 'quickLink']);
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

  it('sortHomeItems：未排序项按默认位插入（相对已布局卡锚点）', () => {
    const items = buildHomeItems(
      [{ name: 'UserCount', label: '用户总数', value: '1' }],
      [widget('Monitor', 8), widget('SysInfo', 4), widget('QuickLink', 4)],
    );
    const layout: Record<string, LayoutItem> = { sysInfo: { sort: 0 } };
    const rs = sortHomeItems(items, layout);
    // KPI 前；内容部件：Monitor（默认序在 sysInfo 前）插到 sysInfo 之前，QuickLink 无锚点追加末尾
    expect(rs.map((it) => it.key)).toEqual(['userCount', 'monitor', 'sysInfo', 'quickLink']);
  });

  it('sortHomeItems：未布局业务新 KPI 自动上浮到已布局 KPI 簇之前', () => {
    // 后端 kpis 已按默认序下发：[Biz, UserCount, TodayLogin, OnlineCount]（业务卡在前）
    const items = buildHomeItems(
      [
        { name: 'Biz', label: '今日订单', value: '3' },
        { name: 'UserCount', label: '用户总数', value: '1' },
        { name: 'TodayLogin', label: '今日登录', value: '2' },
        { name: 'OnlineCount', label: '在线用户', value: '4' },
      ],
      [],
    );
    // 用户只拖过三张魔方卡，新业务卡 Biz 未布局
    const layout: Record<string, LayoutItem> = {
      userCount: { sort: 0 },
      todayLogin: { sort: 1 },
      onlineCount: { sort: 2 },
    };
    const rs = sortHomeItems(items, layout);
    // Biz 默认序最前 → 插到 UserCount 之前（业务新卡不沉底）
    expect(rs.map((it) => it.key)).toEqual(['biz', 'userCount', 'todayLogin', 'onlineCount']);
  });

  it('sortHomeItems：魔方新 KPI 按默认位插入自然位且用户拖序不变', () => {
    // 后端新增 MaxOnline（默认序在 OnlineCount 与 Error24h 之间）
    const items = buildHomeItems(
      [
        { name: 'UserCount', label: '用户总数', value: '1' },
        { name: 'OnlineCount', label: '在线用户', value: '3' },
        { name: 'MaxOnline', label: '最大在线', value: '5' },
        { name: 'Error24h', label: '24h异常', value: '9' },
      ],
      [],
    );
    // 用户拖过：UserCount 第一、Error24h 第二、OnlineCount 第三（把 Error24h 提到 OnlineCount 前）
    const layout: Record<string, LayoutItem> = {
      userCount: { sort: 0 },
      error24h: { sort: 1 },
      onlineCount: { sort: 2 },
    };
    const rs = sortHomeItems(items, layout);
    // MaxOnline 默认位在 OnlineCount 与 Error24h 之间 → 插到 Error24h 前；已拖卡相对序不变
    expect(rs.map((it) => it.key)).toEqual(['userCount', 'maxOnline', 'error24h', 'onlineCount']);
  });

  it('sortHomeItems：隐藏项剔除（hide=true 不渲染）', () => {
    const items = buildHomeItems([{ name: 'UserCount', label: '用户总数', value: '1' }], [widget('Monitor', 8)]);
    const layout: Record<string, LayoutItem> = { userCount: { hide: true } };
    const rs = sortHomeItems(items, layout);
    expect(rs.map((it) => it.key)).toEqual(['monitor']);
  });

  it('sortHomeItems：无布局时保持构建序', () => {
    const items = buildHomeItems([{ name: 'OnlineCount', label: '在线用户', value: '1' }], [widget('SysInfo', 4)]);
    expect(sortHomeItems(items, {}).map((it) => it.key)).toEqual(['onlineCount', 'sysInfo']);
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
    const items = buildHomeItems([{ name: 'OnlineCount', label: '在线用户', value: '1' }], []);
    expect(filterHiddenItems(items, {})).toEqual([]);
  });
});

describe('parseHtmlLink 解析后端 HTML 链接值', () => {
  it('解析 <a href target>text</a>（系统信息「更多信息」）', () => {
    expect(parseHtmlLink('<a href="/Admin/Index/Main" target="_blank">查看完整服务器信息 »</a>')).toEqual({
      href: '/Admin/Index/Main',
      target: '_blank',
      text: '查看完整服务器信息 »',
    });
  });

  it('无 target 属性时省略', () => {
    expect(parseHtmlLink('<a href="/Admin/User">用户管理</a>')).toEqual({
      href: '/Admin/User',
      text: '用户管理',
    });
  });

  it('单引号属性亦可解析', () => {
    expect(parseHtmlLink(`<a href='/Admin/Log'>日志</a>`)).toEqual({ href: '/Admin/Log', text: '日志' });
  });

  it('纯文本/非链接 HTML/空值返回 null', () => {
    expect(parseHtmlLink('普通文本')).toBeNull();
    expect(parseHtmlLink('<div>不是链接</div>')).toBeNull();
    expect(parseHtmlLink('')).toBeNull();
    expect(parseHtmlLink('<a>无 href 链接</a>')).toBeNull();
  });
});
