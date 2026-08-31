/**
 * 首页 / 工作台（AntD6 风格，命名与 MVC 版统一为 Dashboard）
 *
 * - 紧凑横幅：头像 + 时间段问候 + 副标题 + 刷新/个人中心（对齐 MVC Index/Dashboard wb-banner）
 * - 12 列部件栅格：KPI 卡直接排布（每卡 2 列、6 个/行，无外层 Card 容器），内容部件按后端 cols 布局
 * - 卡片三能力：拖动排序 / 保存顺序 / 隐藏（统一扁平列表，布局按用户持久化到 Parameter）
 * - 内容部件由后端 /Admin/Index/Dashboard 的 widgets 数组驱动（name→组件映射，对齐 MVC WidgetManager）
 * - 性能监控：轮询 /Admin/Index/MonitorData（对齐 MVC 契约 {xs, series}）
 * - 快捷入口 / 登录与在线 / 个人信息 / 系统信息：来自内容部件数据，缺失时隐藏
 */
import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import {
  AppstoreAddOutlined,
  AppstoreOutlined,
  BugOutlined,
  CalendarOutlined,
  ClockCircleOutlined,
  EyeInvisibleOutlined,
  EyeOutlined,
  FileTextOutlined,
  HolderOutlined,
  LineChartOutlined,
  MoreOutlined,
  ReloadOutlined,
  SaveOutlined,
  TeamOutlined,
  UserOutlined,
} from '@ant-design/icons';
import { App, Button, Card, Dropdown, Empty, Space } from 'antd';
import * as echarts from 'echarts';
import { useNavigate } from 'react-router-dom';
import { api } from '@/api';
import { useUserStore } from '@/stores/user';
import { getConfig } from '@/configure';
import {
  useDashboard,
  type DashboardKpi,
  type DashboardLoginLog,
  type DashboardQuickLinkData,
  type DashboardWidget,
} from '@/hooks/useDashboard';
import { resolveIcon } from '@/utils/icon';

/** KPI 语义名 → 图标（MVC Widget 部件名优先，兼容旧语义名降级数据） */
const KPI_ICONS: Record<string, ReactNode> = {
  // MVC Widget 部件名（后端 Dashboard 由 WidgetManager 驱动返回）
  UserCount: <TeamOutlined />,
  TodayLogin: <UserOutlined />,
  OnlineCount: <AppstoreOutlined />,
  Log24h: <FileTextOutlined />,
  Error24h: <BugOutlined />,
  CpuRate: <LineChartOutlined />,
  MyDays: <CalendarOutlined />,
  MyLogins: <ClockCircleOutlined />,
  // 兼容旧语义名（接口不可用时的降级数据）
  users: <TeamOutlined />,
  login: <UserOutlined />,
  online: <AppstoreOutlined />,
  log: <FileTextOutlined />,
  error: <BugOutlined />,
  cpu: <LineChartOutlined />,
};

/** 工作台卡片布局项（排序 + 隐藏），对应后端 WidgetLayout */
interface WidgetLayoutItem {
  sort?: number;
  hide?: boolean;
}

/** 工作台统一布局项：KPI 卡或内容部件（拖动排序共用一张 layout map） */
export interface HomeItem {
  kind: 'kpi' | 'widget';
  key: string;
  cols: number;
  kpi?: DashboardKpi;
  widget?: DashboardWidget;
}

/**
 * 布局 key 归一化：后端 Json 序列化强制 camelCase（字典 key 首字母小写），
 * 部件名（UserCount/Monitor）统一转首字母小写（userCount/monitor）后访问布局
 */
export const layoutKey = (name?: string) => (name ? name.charAt(0).toLowerCase() + name.slice(1) : '');

/** 合并 KPI 与内容部件为统一布局项（KPI 前、部件后，保持后端顺序） */
export const buildHomeItems = (allKpis: DashboardKpi[], allWidgets: DashboardWidget[]): HomeItem[] => [
  ...allKpis.map((k) => ({ kind: 'kpi' as const, key: layoutKey(k.name), cols: 2, kpi: k })),
  ...allWidgets.map((w) => ({ kind: 'widget' as const, key: layoutKey(w.name), cols: w.cols || 6, widget: w })),
];

/**
 * 按用户布局过滤 + 排序（隐藏项剔除）。
 * KPI 组恒在内容部件之前（指标卡直排首行）；组内按布局 sort 排，未排序项保持构建序兜底
 */
export const sortHomeItems = (items: HomeItem[], layout: Record<string, WidgetLayoutItem>): HomeItem[] => {
  const idx = new Map(items.map((it, i) => [it.key, i]));
  return items
    .filter((it) => !layout[it.key]?.hide)
    .sort((a, b) => {
      // KPI 卡恒在内容部件之前
      if (a.kind !== b.kind) return a.kind === 'kpi' ? -1 : 1;
      const sa = layout[a.key]?.sort ?? idx.get(a.key)!;
      const sb = layout[b.key]?.sort ?? idx.get(b.key)!;
      return sa - sb;
    });
};

/** 用户已隐藏的项（恢复面板用） */
export const filterHiddenItems = (items: HomeItem[], layout: Record<string, WidgetLayoutItem>): HomeItem[] =>
  items.filter((it) => layout[it.key]?.hide);

export default function HomePage() {
  const { message } = App.useApp();
  const navigate = useNavigate();
  const userInfo = useUserStore((s) => s.userInfo);
  const { data: wb, reload: reloadWb } = useDashboard();
  const [now, setNow] = useState(new Date());
  const chartRef = useRef<HTMLDivElement>(null);
  const chartInstRef = useRef<echarts.ECharts | null>(null);
  const [monitor, setMonitor] = useState<{ xs: string[]; cpu: number[]; mem: number[] }>({ xs: [], cpu: [], mem: [] });

  // 时钟
  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 60000);
    return () => clearInterval(t);
  }, []);

  // 监控数据轮询（对齐 MVC MonitorData 契约：{ xs, series: [[cpu],[mem]] }）
  useEffect(() => {
    let cancelled = false;
    const poll = async () => {
      try {
        const res = await api.client.get('/Admin/Index/MonitorData');
        const d = (res.data as { data?: { xs?: string[]; series?: number[][] } })?.data ?? (res.data as { xs?: string[]; series?: number[][] });
        if (!d || cancelled) return;
        setMonitor((prev) => ({
          xs: [...prev.xs, ...(d.xs ?? [])].slice(-60),
          cpu: [...prev.cpu, ...(d.series?.[0] ?? [])].slice(-60),
          mem: [...prev.mem, ...(d.series?.[1] ?? [])].slice(-60),
        }));
      } catch {
        /* 接口不可用静默 */
      }
    };
    void poll();
    const t = setInterval(() => void poll(), 5000);
    return () => {
      cancelled = true;
      clearInterval(t);
    };
  }, []);

  // 性能曲线渲染（文字/边框色取主题 CSS 变量，明暗两套自适应）
  useEffect(() => {
    if (!chartRef.current || monitor.xs.length < 2) return;
    // 卡片隐藏后重新显示时，旧实例已挂在已卸载节点上，先释放再重建
    chartInstRef.current?.dispose();
    const textColor =
      getComputedStyle(document.body).getPropertyValue('--cube-text-muted').trim() || '#94a3b8';
    const borderColor =
      getComputedStyle(document.body).getPropertyValue('--cube-border-soft').trim() || 'rgba(148,163,184,.4)';
    const chart = echarts.init(chartRef.current);
    chartInstRef.current = chart;
    chart.setOption({
      tooltip: { trigger: 'axis' },
      legend: { data: ['CPU', '内存'], top: 0, right: 0, textStyle: { color: textColor } },
      grid: { left: 8, right: 8, top: 32, bottom: 0, containLabel: true },
      xAxis: {
        type: 'category',
        data: monitor.xs,
        boundaryGap: false,
        axisLine: { lineStyle: { color: borderColor } },
        axisLabel: { color: textColor },
      },
      yAxis: {
        type: 'value',
        min: 0,
        max: 100,
        splitLine: { lineStyle: { color: borderColor } },
        axisLabel: { color: textColor, formatter: '{value}%' },
      },
      series: [
        { name: 'CPU', type: 'line', smooth: true, showSymbol: false, data: monitor.cpu, lineStyle: { width: 2 }, areaStyle: { opacity: 0.1 } },
        { name: '内存', type: 'line', smooth: true, showSymbol: false, data: monitor.mem, lineStyle: { width: 2 }, areaStyle: { opacity: 0.1 } },
      ],
    });
    const onResize = () => chart.resize();
    window.addEventListener('resize', onResize);
    return () => {
      window.removeEventListener('resize', onResize);
      chart.dispose();
      if (chartInstRef.current === chart) chartInstRef.current = null;
    };
  }, [monitor]);

  // ── 工作台布局（卡片三能力：拖动排序 / 保存顺序 / 隐藏，统一扁平列表）──
  const [layout, setLayout] = useState<Record<string, WidgetLayoutItem>>({});
  const [dragKey, setDragKey] = useState<string | null>(null);

  // 读取用户布局（后端 Parameter 持久化）
  useEffect(() => {
    let cancelled = false;
    api.client
      .get('/Admin/Index/GetWidgetLayout')
      .then((res) => {
        if (cancelled) return;
        const data = (res.data as { data?: Record<string, WidgetLayoutItem> })?.data;
        if (data && Object.keys(data).length) setLayout(data);
      })
      .catch(() => {
        /* 布局接口不可用静默 */
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const handleSaveLayout = () => {
    api.client
      .post('/Admin/Index/SaveWidgetLayout', layout)
      .then(() => message.success('布局已保存'))
      .catch(() => message.error('保存失败'));
  };

  const handleResetLayout = () => {
    setLayout({});
    api.client
      .post('/Admin/Index/ResetWidgetLayout')
      .then(() => message.success('布局已重置'))
      .catch(() => message.error('重置失败'));
  };

  // 隐藏 / 恢复（KPI 卡与内容部件共用布局 key）
  const handleHide = (key: string) =>
    setLayout((prev) => ({ ...prev, [key]: { ...(prev[key] ?? {}), hide: true } }));

  const handleUnhide = (key: string) =>
    setLayout((prev) => {
      const next = { ...prev };
      next[key] = { ...(next[key] ?? {}), hide: false };
      return next;
    });

  // 拖拽落点：组内（KPI 之间 / 内容部件之间）重排并重新分配排序，跨组拖拽忽略
  const handleDrop = (target: string) => {
    if (!dragKey || dragKey === target) {
      setDragKey(null);
      return;
    }
    const dragItem = allItems.find((it) => it.key === dragKey);
    const targetItem = allItems.find((it) => it.key === target);
    if (!dragItem || !targetItem || dragItem.kind !== targetItem.kind) {
      setDragKey(null);
      return;
    }
    setLayout((prev) => {
      const visible = allItems.filter((it) => !prev[it.key]?.hide && it.key !== dragKey && it.kind === dragItem.kind);
      const idx = visible.findIndex((it) => it.key === target);
      visible.splice(idx < 0 ? visible.length : idx, 0, dragItem);
      const next = { ...prev };
      visible.forEach((it, i) => {
        next[it.key] = { ...(next[it.key] ?? {}), sort: i };
      });
      return next;
    });
    setDragKey(null);
  };

  // KPI：接口部件数据（可见 + 已隐藏）优先，缺失时降级个人统计
  const allKpis = useMemo<DashboardKpi[]>(() => {
    if (wb?.kpis?.length || wb?.hiddenKpis?.length) return [...(wb.kpis ?? []), ...(wb.hiddenKpis ?? [])];
    return [
      { name: 'login', label: '我的登录', value: '—', color: 'green', trend: '累计登录次数' },
      { name: 'online', label: '在线状态', value: '在线', color: 'cyan', trend: '当前账号状态' },
      { name: 'users', label: '我的角色', value: userInfo?.roleName || '—', color: 'purple', trend: '当前角色' },
    ];
  }, [wb, userInfo]);

  // 内容部件：后端 widgets 优先；旧后端（无 widgets 字段）降级硬编码清单，数据取自旧聚合字段
  const allWidgets = useMemo<DashboardWidget[]>(() => {
    if (wb?.widgets?.length || wb?.hiddenWidgets?.length) return [...(wb.widgets ?? []), ...(wb.hiddenWidgets ?? [])];
    const rs: DashboardWidget[] = [
      { name: 'Monitor', title: '性能监控', icon: 'fa-line-chart', cols: 8, category: '系统', widgetType: 'Chart', data: null },
      { name: 'QuickLink', title: '快捷入口', icon: 'fa-th-large', cols: 4, category: '通用', widgetType: 'Content', data: { links: wb?.quickLinks ?? [] } },
      { name: 'Profile', title: '个人信息', icon: 'fa-user-circle', cols: 4, category: '个人', widgetType: 'Content', data: wb?.profile },
    ];
    if (wb?.sysInfo && Object.keys(wb.sysInfo).length)
      rs.push({ name: 'SysInfo', title: '系统信息', icon: 'fa-server', cols: 4, category: '系统', widgetType: 'Kv', data: wb.sysInfo });
    return rs;
  }, [wb]);

  // 统一布局项：KPI 卡（span 2）+ 内容部件（span=cols），隐藏/排序共用 layout map
  const allItems = useMemo(() => buildHomeItems(allKpis, allWidgets), [allKpis, allWidgets]);
  const visibleItems = useMemo(() => sortHomeItems(allItems, layout), [allItems, layout]);
  const hiddenItems = useMemo(() => filterHiddenItems(allItems, layout), [allItems, layout]);
  const hiddenKpis = hiddenItems.filter((it) => it.kind === 'kpi');
  const hiddenWidgets = hiddenItems.filter((it) => it.kind === 'widget');

  const userCard = wb?.user;

  const today = `${now.getFullYear()}年${now.getMonth() + 1}月${now.getDate()}日 星期${'日一二三四五六'[now.getDay()]}`;
  const displayName = userCard?.displayName || userCard?.name || userInfo?.displayName || userInfo?.name || '用户';
  const roles = userCard?.roles?.join(' / ') || userInfo?.roleName || '';
  // 时间段问候（对齐 MVC Index/Dashboard：夜深了/早上好/中午好/下午好/晚上好）
  const greet =
    now.getHours() < 6
      ? '夜深了'
      : now.getHours() < 12
        ? '早上好'
        : now.getHours() < 14
          ? '中午好'
          : now.getHours() < 18
            ? '下午好'
            : '晚上好';

  // 拖拽事件：可拖入时放行，落点触发重排
  const dropProps = (key: string) => ({
    onDragOver: (e: React.DragEvent) => {
      if (dragKey && dragKey !== key) e.preventDefault();
    },
    onDrop: (e: React.DragEvent) => {
      e.preventDefault();
      handleDrop(key);
    },
  });

  // 拖拽手柄：记录当前拖拽项（卡片点击跳转等事件经 stopPropagation 隔离）
  const dragHandleProps = (key: string) => ({
    draggable: true,
    onDragStart: (e: React.DragEvent) => {
      e.stopPropagation();
      e.dataTransfer.effectAllowed = 'move';
      e.dataTransfer.setData('text/plain', key);
      setDragKey(key);
    },
    onDragEnd: () => setDragKey(null),
  });

  /** 快捷入口部件正文：链接网格 */
  const renderQuickLinkBody = (data?: DashboardQuickLinkData): ReactNode => (
    <div className="cube-home-quick-grid">
      {(data?.links ?? []).map((link) => (
        <div key={link.url} className="cube-home-quick-link" onClick={() => link.url && navigate(link.url)}>
          <div className="cube-home-quick-icon">
            {link.icon ? <span style={{ fontSize: 16 }}>{link.icon}</span> : <AppstoreOutlined />}
          </div>
          <div>
            <div className="cube-home-quick-title">{link.name}</div>
            <div className="cube-home-quick-url">{link.url}</div>
          </div>
        </div>
      ))}
      {!data?.links?.length && <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="暂无快捷入口" />}
    </div>
  );

  /** 登录与在线部件正文：最近登录 + 当前在线双列 */
  const renderLoginLogBody = (data?: DashboardLoginLog): ReactNode => (
    <div className="cube-home-login-grid">
      <div>
        <div className="cube-home-login-title">最近登录</div>
        <div className="cube-home-login-list">
          {(data?.logins ?? []).map((it, i) => (
            <div key={i} className="cube-home-login-item">
              <span className="cube-home-login-name">{it.userName || '—'}</span>
              <span className="cube-home-login-action">{it.action || ''}</span>
              <span className="cube-home-login-time">{it.createTime || ''}</span>
            </div>
          ))}
          {!data?.logins?.length && <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="暂无登录记录" />}
        </div>
      </div>
      <div>
        <div className="cube-home-login-title">当前在线</div>
        <div className="cube-home-login-list">
          {(data?.onlines ?? []).map((it, i) => (
            <div key={i} className="cube-home-login-item">
              <span className="cube-home-login-name">{it.name || '—'}</span>
              <span className="cube-home-login-time">{it.createTime || ''}</span>
            </div>
          ))}
          {!data?.onlines?.length && <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="暂无在线用户" />}
        </div>
      </div>
    </div>
  );

  /** 个人信息部件正文：账号统计 */
  const renderProfileBody = (data?: Record<string, unknown>): ReactNode => (
    <div className="cube-home-info-list">
      <div className="cube-home-info-item">
        <span className="cube-home-info-key">登录次数</span>
        <span className="cube-home-info-value">{String(data?.logins ?? '—')}</span>
      </div>
      <div className="cube-home-info-item">
        <span className="cube-home-info-key">最近登录</span>
        <span className="cube-home-info-value">{String(data?.lastLogin ?? '—')}</span>
      </div>
      <div className="cube-home-info-item">
        <span className="cube-home-info-key">登录 IP</span>
        <span className="cube-home-info-value">{String(data?.lastLoginIP ?? '—')}</span>
      </div>
      <div className="cube-home-info-item">
        <span className="cube-home-info-key">注册时间</span>
        <span className="cube-home-info-value">{String(data?.registerTime ?? '—')}</span>
      </div>
    </div>
  );

  /** 键值字典正文（系统信息 / 未知名部件兜底） */
  const renderKvBody = (data?: Record<string, unknown>): ReactNode =>
    data ? (
      <div className="cube-home-info-list">
        {Object.entries(data).map(([k, v]) => (
          <div key={k} className="cube-home-info-item">
            <span className="cube-home-info-key">{k}</span>
            <span className="cube-home-info-value">{String(v ?? '')}</span>
          </div>
        ))}
      </div>
    ) : null;

  /** 渲染内容部件正文（name→组件映射，对齐 MVC WidgetType 分发） */
  const renderWidgetBody = (w: DashboardWidget): ReactNode => {
    const data = w.data as Record<string, unknown> | undefined;
    switch (w.name) {
      case 'Monitor':
        return (
          <>
            <div ref={chartRef} className="cube-home-monitor-chart" />
            {monitor.xs.length < 2 && (
              <div style={{ textAlign: 'center', color: 'var(--cube-text-muted)', padding: '20px 0' }}>等待监控数据…</div>
            )}
          </>
        );
      case 'SysInfo':
        return renderKvBody(data);
      case 'LoginLog':
        return renderLoginLogBody(data as DashboardLoginLog | undefined);
      case 'QuickLink':
        return renderQuickLinkBody(data as DashboardQuickLinkData | undefined);
      case 'Profile':
        return renderProfileBody(data);
      default:
        // 未知名部件：键值字典兜底
        return renderKvBody(data);
    }
  };

  return (
    <div className="cube-home-page">
      {/* 紧凑欢迎横幅（对齐 MVC wb-banner） */}
      <div className="cube-home-banner">
        <div className="cube-home-banner-left">
          <div className="cube-home-banner-avatar" title="进入个人中心" role="button" onClick={() => navigate('/profile')}>
            {userInfo?.avatar ? <img src={userInfo.avatar} alt="avatar" /> : <UserOutlined />}
          </div>
          <div className="cube-home-banner-copy">
            <div className="cube-home-banner-greet">
              {greet}，{displayName}
            </div>
            <div className="cube-home-banner-sub">
              欢迎回到 {getConfig().base.title} · {today}
              {roles ? ` · ${roles}` : ''}
            </div>
          </div>
        </div>
        <div className="cube-home-banner-right">
          <Button
            type="text"
            icon={<ReloadOutlined />}
            title="刷新工作台数据"
            aria-label="刷新工作台数据"
            onClick={() => void reloadWb()}
          />
          <Button type="text" icon={<UserOutlined />} onClick={() => navigate('/profile')}>
            个人中心
          </Button>
        </div>
      </div>

      {/* 卡片布局工具栏：拖动提示 + 保存 / 恢复 / 重置（卡片三能力） */}
      <div className="cube-home-widget-toolbar">
        <span className="cube-home-widget-hint">
          <HolderOutlined /> 拖动卡片标题调整顺序，隐藏后可恢复
        </span>
        <Space wrap>
          <Button size="small" icon={<SaveOutlined />} onClick={handleSaveLayout}>
            保存布局
          </Button>
          <Dropdown
            menu={{
              items: [
                ...(hiddenWidgets.length
                  ? [
                      {
                        type: 'group' as const,
                        label: '内容卡片',
                        children: hiddenWidgets.map((it) => ({
                          key: it.key,
                          label: it.widget?.title ?? it.key,
                          icon: <EyeOutlined />,
                          onClick: () => handleUnhide(it.key),
                        })),
                      },
                    ]
                  : []),
                ...(hiddenKpis.length
                  ? [
                      {
                        type: 'group' as const,
                        label: '指标小卡',
                        children: hiddenKpis.map((it) => ({
                          key: `kpi-${it.key}`,
                          label: it.kpi?.label ?? it.key,
                          icon: <EyeOutlined />,
                          onClick: () => handleUnhide(it.key),
                        })),
                      },
                    ]
                  : []),
              ],
            }}
            disabled={!hiddenItems.length}
          >
            <Button size="small" icon={<AppstoreAddOutlined />} disabled={!hiddenItems.length}>
              恢复卡片
            </Button>
          </Dropdown>
          <Button size="small" onClick={handleResetLayout}>
            重置布局
          </Button>
        </Space>
      </div>

      {/* 12 列部件栅格：KPI 卡直接排布（span 2）+ 内容部件（span=cols），可拖动排序 / 隐藏 */}
      <div className="cube-home-grid">
        {visibleItems.map((item) => {
          if (item.kind === 'kpi' && item.kpi) {
            const k = item.kpi;
            return (
              <div
                key={item.key}
                className="cube-home-kpi-card"
                style={k.url ? { cursor: 'pointer' } : undefined}
                {...dropProps(item.key)}
                onClick={(e) => {
                  // 拖动手柄 / 隐藏菜单（含 antd 弹层 portal，事件按组件树冒泡到卡片）不触发卡片跳转
                  const target = e.target as HTMLElement;
                  if (target.closest('.cube-home-kpi-actions') || target.closest('.ant-dropdown')) return;
                  if (k.url) navigate(k.url);
                }}
              >
                <div className="cube-home-kpi-head">
                  <div className="cube-home-kpi-head-left">
                    <div className={`cube-home-kpi-icon ${k.color || 'blue'}`}>{KPI_ICONS[k.name ?? ''] ?? null}</div>
                    <span className="cube-home-kpi-label">{k.label}</span>
                  </div>
                  <span className="cube-home-kpi-actions">
                    <span className="cube-kpi-drag-handle" title="拖动排序" {...dragHandleProps(item.key)}>
                      <HolderOutlined />
                    </span>
                    <Dropdown
                      trigger={['click']}
                      menu={{
                        items: [{ key: 'hide', icon: <EyeInvisibleOutlined />, label: '隐藏', onClick: () => handleHide(item.key) }],
                      }}
                    >
                      <Button type="text" size="small" icon={<MoreOutlined />} />
                    </Dropdown>
                  </span>
                </div>
                <div>
                  <div className="cube-home-kpi-value">{k.value}</div>
                  {k.trend && <div className="cube-home-kpi-trend">{k.trend}</div>}
                </div>
              </div>
            );
          }
          if (item.kind === 'widget' && item.widget) {
            const w = item.widget;
            return (
              <div
                key={item.key}
                className="cube-home-widget"
                style={{ gridColumn: `span ${item.cols}` }}
                {...dropProps(item.key)}
              >
                <Card
                  className="cube-home-card"
                  size="small"
                  title={
                    <span className="cube-widget-title">
                      <span className="cube-widget-drag-handle" title="拖动排序" {...dragHandleProps(item.key)}>
                        <HolderOutlined />
                      </span>
                      <span className="cube-widget-icon">{resolveIcon(w.icon)}</span>
                      {w.title}
                    </span>
                  }
                  extra={
                    <Dropdown
                      menu={{
                        items: [{ key: 'hide', icon: <EyeInvisibleOutlined />, label: '隐藏卡片', onClick: () => handleHide(item.key) }],
                      }}
                    >
                      <Button type="text" size="small" icon={<MoreOutlined />} />
                    </Dropdown>
                  }
                >
                  {renderWidgetBody(w)}
                </Card>
              </div>
            );
          }
          return null;
        })}
        {!visibleItems.length && (
          <div style={{ gridColumn: '1 / -1' }}>
            <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="暂无卡片" />
          </div>
        )}
      </div>
    </div>
  );
}
