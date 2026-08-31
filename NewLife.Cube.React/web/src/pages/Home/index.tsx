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
  AppstoreOutlined,
  BugOutlined,
  DragOutlined,
  EyeInvisibleOutlined,
  EyeOutlined,
  FileTextOutlined,
  LineChartOutlined,
  MoreOutlined,
  ReloadOutlined,
  TeamOutlined,
  UndoOutlined,
  UserOutlined,
} from '@ant-design/icons';
import { App, Button, Card, Dropdown, Empty, Popover } from 'antd';
import * as echarts from 'echarts';
import { useNavigate } from 'react-router-dom';
import { api } from '@/api';
import { useUserStore } from '@/stores/user';
import { getConfig } from '@/configure';
import {
  useDashboard,
  type DashboardKpi,
  type DashboardLoginLog,
  type DashboardProfile,
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
  // 兼容旧语义名（接口不可用时的降级数据）
  users: <TeamOutlined />,
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

/**
 * 归一化整张布局字典：把后端返回的任意大小写 key（旧版 MVC/历史数据为 PascalCase）统一转
 * camelCase，与 layoutKey 对齐，避免混合大小写导致排序/隐藏失效
 */
export const normalizeLayout = (raw: Record<string, WidgetLayoutItem>) => {
  const rs: Record<string, WidgetLayoutItem> = {};
  for (const [k, v] of Object.entries(raw ?? {})) rs[layoutKey(k)] = v;
  return rs;
};

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

  // ── 工作台布局（卡片三能力：拖动排序 / 即时保存 / 隐藏，统一扁平列表）──
  const [layout, setLayout] = useState<Record<string, WidgetLayoutItem>>({});
  // 布局实时镜像，供提交使用（避免 setLayout 异步导致的闭包过期）
  const layoutRef = useRef(layout);
  useEffect(() => {
    layoutRef.current = layout;
  }, [layout]);

  // 拖拽状态（指针式拖拽：mousedown 手柄启动、mousemove 高亮目标、mouseup 落点重排，
  // 对齐 MVC jQuery sortable 的可靠性，规避 HTML5 DnD 触发卡片点击跳转的问题）
  const [dragKey, setDragKey] = useState<string | null>(null);
  const [dragOverKey, setDragOverKey] = useState<string | null>(null);

  // 读取用户布局（后端 Parameter 持久化，key 统一归一化为 camelCase）
  useEffect(() => {
    let cancelled = false;
    api.client
      .get('/Admin/Index/GetWidgetLayout')
      .then((res) => {
        if (cancelled) return;
        const data = (res.data as { data?: Record<string, WidgetLayoutItem> })?.data;
        if (data && Object.keys(data).length) setLayout(normalizeLayout(data));
      })
      .catch(() => {
        /* 布局接口不可用静默 */
      });
    return () => {
      cancelled = true;
    };
  }, []);

  // 提交布局：更新状态 + 即时保存服务端（对齐 MVC HideWidget/SaveOrder 即时持久化）
  const commitLayout = (next: Record<string, WidgetLayoutItem>) => {
    layoutRef.current = next;
    setLayout(next);
    api.client
      .post('/Admin/Index/SaveWidgetLayout', next)
      .catch(() => {
        /* 保存失败静默，下次操作重试 */
      });
  };

  const handleResetLayout = () => {
    setLayout({});
    layoutRef.current = {};
    api.client
      .post('/Admin/Index/ResetWidgetLayout')
      .then(() => message.success('布局已重置'))
      .catch(() => message.error('重置失败'));
  };

  // 隐藏 / 恢复（KPI 卡与内容部件共用布局 key，即时保存服务端）
  const handleHide = (key: string) =>
    commitLayout({ ...layoutRef.current, [key]: { ...(layoutRef.current[key] ?? {}), hide: true } });

  const handleUnhide = (key: string) => {
    const next = { ...layoutRef.current };
    next[key] = { ...(next[key] ?? {}), hide: false };
    commitLayout(next);
  };

  // 拖拽落点：组内（KPI 之间 / 内容部件之间）重排并即时保存，跨组拖拽忽略
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
    const visible = allItems.filter(
      (it) => !layoutRef.current[it.key]?.hide && it.key !== dragKey && it.kind === dragItem.kind,
    );
    const idx = visible.findIndex((it) => it.key === target);
    visible.splice(idx < 0 ? visible.length : idx, 0, dragItem);
    const next = { ...layoutRef.current };
    visible.forEach((it, i) => {
      next[it.key] = { ...(next[it.key] ?? {}), sort: i };
    });
    commitLayout(next);
    setDragKey(null);
  };

  // 最新 handleDrop 引用（供拖拽全局监听使用，避免闭包过期）
  const handleDropRef = useRef(handleDrop);
  useEffect(() => {
    handleDropRef.current = handleDrop;
  });

  // 指针式拖拽全局监听：拖拽期间 mousemove 高亮目标卡，mouseup 触发重排
  useEffect(() => {
    if (!dragKey) return;
    const onMove = (e: MouseEvent) => {
      const el = document.elementFromPoint(e.clientX, e.clientY) as HTMLElement | null;
      setDragOverKey(el?.closest<HTMLElement>('.cube-home-widget, .cube-home-kpi-card')?.dataset.key ?? null);
    };
    const onUp = (e: MouseEvent) => {
      const el = document.elementFromPoint(e.clientX, e.clientY) as HTMLElement | null;
      const target = el?.closest<HTMLElement>('.cube-home-widget, .cube-home-kpi-card')?.dataset.key;
      if (target) handleDropRef.current(target);
      else setDragKey(null);
      setDragOverKey(null);
    };
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
    return () => {
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
    };
  }, [dragKey]);

  // 拖拽手柄：mousedown 启动拖拽（preventDefault 抑制点击跳转）
  const startDrag = (key: string) => (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragKey(key);
  };

  // KPI：接口部件数据（可见 + 已隐藏）优先，缺失时降级个人统计
  const allKpis = useMemo<DashboardKpi[]>(() => {
    if (wb?.kpis?.length || wb?.hiddenKpis?.length) return [...(wb.kpis ?? []), ...(wb.hiddenKpis ?? [])];
    return [
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

  /** 时间格式化（对齐 MVC LoginLog：登录 MM-dd HH:mm、在线 HH:mm） */
  const fmtTime = (t?: string, pat: 'mdhm' | 'hm' = 'mdhm'): string => {
    if (!t) return '';
    const d = new Date(t);
    if (Number.isNaN(d.getTime())) return t;
    const pad = (n: number) => String(n).padStart(2, '0');
    return pat === 'mdhm'
      ? `${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`
      : `${pad(d.getHours())}:${pad(d.getMinutes())}`;
  };

  /** 快捷入口部件正文：最近访问在前、系统最新菜单补足，紧凑链接（对齐 MVC QuickLink.cshtml quicklink-item） */
  const renderQuickLinkBody = (data?: DashboardQuickLinkData): ReactNode => (
    <div className="cube-home-quick-grid">
      {(data?.links ?? []).map((link) => (
        <div key={link.url} className="cube-home-quick-link" title={link.url} onClick={() => link.url && navigate(link.url)}>
          {resolveIcon(link.icon)}
          <span className="cube-home-quick-name">{link.name}</span>
        </div>
      ))}
      {!data?.links?.length && <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="暂无快捷入口" />}
    </div>
  );

  /** 登录与在线部件正文：最近登录 + 在线用户双列，时间在前（对齐 MVC LoginLog.cshtml list-time/list-name/list-action） */
  const renderLoginLogBody = (data?: DashboardLoginLog): ReactNode => (
    <div className="cube-home-login-grid">
      <div>
        <div className="cube-home-login-title">最近登录</div>
        <div className="cube-home-login-list">
          {(data?.logins ?? []).map((it, i) => (
            <div key={i} className="cube-home-login-item" title={it.createIP ? `${it.action || ''} ${it.createIP}` : undefined}>
              <span className="cube-home-login-time">{fmtTime(it.createTime)}</span>
              <span className="cube-home-login-name">{it.userName || '—'}</span>
              <span className="cube-home-login-action">{it.action || ''}</span>
            </div>
          ))}
          {!data?.logins?.length && <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="最近24h无登录记录" />}
        </div>
      </div>
      <div>
        <div className="cube-home-login-title">在线用户</div>
        <div className="cube-home-login-list">
          {(data?.onlines ?? []).map((it, i) => (
            <div key={i} className="cube-home-login-item" title={it.oAuthProvider}>
              <span className="cube-home-login-time">{fmtTime(it.createTime, 'hm')}</span>
              <span className="cube-home-login-name">{it.name || '—'}</span>
              <span className="cube-home-login-action">{it.oAuthProvider || ''}</span>
            </div>
          ))}
          {!data?.onlines?.length && <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="当前无在线用户" />}
        </div>
      </div>
    </div>
  );

  /** 个人信息部件正文：头像 + 名称/角色 + 账号表格（对齐 MVC Profile.cshtml widget-profile） */
  const renderProfileBody = (p?: DashboardProfile): ReactNode => (
    <div className="cube-home-profile">
      <div className="cube-home-profile-main">
        <div className="cube-home-profile-avatar">
          {userInfo?.avatar ? <img src={userInfo.avatar} alt="avatar" /> : <UserOutlined />}
        </div>
        <div className="cube-home-profile-info">
          <div className="cube-home-profile-name">{p?.displayName || displayName}</div>
          <div className="cube-home-profile-role">{p?.roleNames || roles || '—'}</div>
        </div>
      </div>
      <div className="cube-home-info-list">
        <div className="cube-home-info-item">
          <span className="cube-home-info-key">账号</span>
          <span className="cube-home-info-value">{p?.name ?? '—'}</span>
        </div>
        <div className="cube-home-info-item">
          <span className="cube-home-info-key">状态</span>
          <span className="cube-home-info-value">{p?.online ? '在线' : '离线'}</span>
        </div>
        <div className="cube-home-info-item">
          <span className="cube-home-info-key">登录次数</span>
          <span className="cube-home-info-value">{p?.logins ?? '—'} 次</span>
        </div>
        <div className="cube-home-info-item">
          <span className="cube-home-info-key">上次登录</span>
          <span className="cube-home-info-value">{p?.lastLogin || '—'}</span>
        </div>
        <div className="cube-home-info-item">
          <span className="cube-home-info-key">上次地址</span>
          <span className="cube-home-info-value">{p?.lastLoginIP || '—'}</span>
        </div>
        <div className="cube-home-info-item">
          <span className="cube-home-info-key">注册时间</span>
          <span className="cube-home-info-value">{p?.registerTime || '—'}</span>
        </div>
      </div>
      <div className="cube-home-profile-more">
        <a role="button" onClick={() => navigate('/profile')}>
          个人中心 »
        </a>
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
        return renderProfileBody(data as DashboardProfile | undefined);
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
          {/* 已隐藏 N：仅当有隐藏卡片时显示，点击弹出恢复面板（对齐 MVC btn-widget-hidden + wb-hidden-pop） */}
          {hiddenItems.length > 0 && (
            <Popover
              trigger="click"
              placement="bottomRight"
              arrow={false}
              styles={{ content: { padding: 0, borderRadius: 10 } }}
              content={
                <div className="cube-hidden-pop">
                  <div className="cube-hidden-pop-title">已隐藏卡片</div>
                  <ul className="cube-hidden-pop-list">
                    {hiddenWidgets.length > 0 && <li className="cube-hidden-pop-group">内容卡片</li>}
                    {hiddenWidgets.map((it) => (
                      <li key={it.key} className="cube-hidden-pop-item">
                        <span className="cube-hidden-pop-name">
                          {resolveIcon(it.widget?.icon)}
                          {it.widget?.title ?? it.key}
                        </span>
                        <Button type="primary" size="small" onClick={() => handleUnhide(it.key)}>
                          恢复
                        </Button>
                      </li>
                    ))}
                    {hiddenKpis.length > 0 && <li className="cube-hidden-pop-group">指标小卡</li>}
                    {hiddenKpis.map((it) => (
                      <li key={`kpi-${it.key}`} className="cube-hidden-pop-item">
                        <span className="cube-hidden-pop-name">
                          {KPI_ICONS[it.kpi?.name ?? ''] ?? null}
                          {it.kpi?.label ?? it.key}
                        </span>
                        <Button type="primary" size="small" onClick={() => handleUnhide(it.key)}>
                          恢复
                        </Button>
                      </li>
                    ))}
                  </ul>
                  <div className="cube-hidden-pop-foot">
                    <a role="button" onClick={handleResetLayout}>
                      <UndoOutlined /> 恢复默认布局
                    </a>
                  </div>
                </div>
              }
            >
              <Button type="text" icon={<EyeInvisibleOutlined />}>
                已隐藏 {hiddenItems.length}
              </Button>
            </Popover>
          )}
          <Button type="text" icon={<UserOutlined />} onClick={() => navigate('/profile')}>
            个人中心
          </Button>
        </div>
      </div>

      {/* 卡片布局工具栏：拖动提示 + 重置布局（隐藏/排序已即时保存服务端，对齐 MVC） */}
      <div className="cube-home-widget-toolbar">
        <span className="cube-home-widget-hint">
          <DragOutlined /> 拖动卡片标题调整顺序，隐藏后可恢复，操作自动保存
        </span>
        <Button size="small" onClick={handleResetLayout}>
          重置布局
        </Button>
      </div>

      {/* 12 列部件栅格：KPI 卡直接排布（span 2）+ 内容部件（span=cols），指针式拖动排序 / 隐藏 */}
      <div className="cube-home-grid">
        {visibleItems.map((item) => {
          if (item.kind === 'kpi' && item.kpi) {
            const k = item.kpi;
            return (
              <div
                key={item.key}
                data-key={item.key}
                className={`cube-home-kpi-card${dragOverKey === item.key ? ' cube-home-drag-over' : ''}`}
                style={k.url ? { cursor: 'pointer' } : undefined}
                onClick={(e) => {
                  // 拖拽十字 / 隐藏菜单（含 antd 弹层 portal，事件按组件树冒泡到卡片）不触发卡片跳转
                  const target = e.target as HTMLElement;
                  if (target.closest('.cube-home-kpi-actions') || target.closest('.ant-dropdown')) return;
                  if (k.url) navigate(k.url);
                }}
              >
                {/* 操作区：三点菜单 + 拖拽十字，绝对定位右上角（对齐 MVC：widget-menu right:22、widget-drag right:8，十字最右、菜单居左） */}
                <span className="cube-home-kpi-actions">
                  <Dropdown
                    trigger={['click']}
                    menu={{
                      items: [{ key: 'hide', icon: <EyeInvisibleOutlined />, label: '隐藏', onClick: () => handleHide(item.key) }],
                    }}
                  >
                    <Button type="text" size="small" icon={<MoreOutlined />} />
                  </Dropdown>
                  <span className="cube-kpi-drag-handle" title="拖动排序" onMouseDown={startDrag(item.key)}>
                    <DragOutlined />
                  </span>
                </span>
                <div className={`cube-home-kpi-icon ${k.color || 'blue'}`}>{KPI_ICONS[k.name ?? ''] ?? null}</div>
                <div className="cube-home-kpi-info">
                  <div className="cube-home-kpi-value">{k.value}</div>
                  <div className="cube-home-kpi-label">{k.label}</div>
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
                data-key={item.key}
                className={`cube-home-widget${dragOverKey === item.key ? ' cube-home-drag-over' : ''}`}
                style={{ gridColumn: `span ${item.cols}` }}
              >
                <Card
                  className="cube-home-card"
                  size="small"
                  title={
                    <span className="cube-widget-title">
                      <span className="cube-widget-icon">{resolveIcon(w.icon)}</span>
                      {w.title}
                    </span>
                  }
                  extra={
                    <span className="cube-widget-actions">
                      <Dropdown
                        trigger={['click']}
                        menu={{
                          items: [{ key: 'hide', icon: <EyeInvisibleOutlined />, label: '隐藏卡片', onClick: () => handleHide(item.key) }],
                        }}
                      >
                        <Button type="text" size="small" icon={<MoreOutlined />} />
                      </Dropdown>
                      {/* 拖拽十字置于头部最右（对齐 MVC widget-header：图标→标题→三点→十字） */}
                      <span className="cube-widget-drag-handle" title="拖动排序" onMouseDown={startDrag(item.key)}>
                        <DragOutlined />
                      </span>
                    </span>
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
