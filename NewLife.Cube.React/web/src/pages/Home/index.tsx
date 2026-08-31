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

  // 拖拽状态（MVC 式实时占位：mousedown 拿起卡片浮层跟随鼠标，mousemove 实时计算
  // 目标位置虚线占位框并腾出位置，mouseup 按占位位置重排；对齐 MVC jQuery sortable placeholder）
  const [dragKey, setDragKey] = useState<string | null>(null);
  const [dragPos, setDragPos] = useState<{ x: number; y: number; w: number; h: number; ox: number; oy: number } | null>(null);
  const [placeholderIndex, setPlaceholderIndex] = useState(-1);

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

  // 拖拽落点：按占位索引在组内重排并即时保存（占位索引 = 同组可见卡中的插入位置）
  const handleDrop = () => {
    const key = dragKey;
    if (!key) {
      setPlaceholderIndex(-1);
      return;
    }
    const dragItem = allItems.find((it) => it.key === key);
    if (!dragItem) {
      setDragKey(null);
      setDragPos(null);
      setPlaceholderIndex(-1);
      return;
    }
    const kind = dragItem.kind;
    const rest = allItems.filter((it) => !layoutRef.current[it.key]?.hide && it.key !== key && it.kind === kind);
    const order = sortHomeItems(rest, layoutRef.current).map((it) => it.key);
    const idx = Math.min(Math.max(placeholderIndex, 0), order.length);
    order.splice(idx, 0, key);
    const next = { ...layoutRef.current };
    order.forEach((it, i) => {
      next[it] = { ...(next[it] ?? {}), sort: i };
    });
    commitLayout(next);
    setDragKey(null);
    setDragPos(null);
    setPlaceholderIndex(-1);
  };

  // 最新 handleDrop 引用（供拖拽全局监听使用，避免闭包过期）
  const handleDropRef = useRef(handleDrop);
  useEffect(() => {
    handleDropRef.current = handleDrop;
  });

  // 指针式拖拽全局监听：mousemove 浮层跟随 + 实时计算占位索引，mouseup 按占位重排
  useEffect(() => {
    if (!dragKey) return;
    const onMove = (e: MouseEvent) => {
      const mx = e.clientX;
      const my = e.clientY;
      // 浮层跟随鼠标（保持手柄相对偏移）
      setDragPos((p) => (p ? { ...p, x: mx - p.ox, y: my - p.oy } : p));
      // 计算同组可见卡中的插入位置（占位索引）
      const dragItem = allItems.find((it) => it.key === dragKey);
      if (!dragItem) return;
      const kind = dragItem.kind;
      const order = visibleItems.filter((it) => it.key !== dragKey && it.kind === kind);
      let idx = order.length;
      for (let i = 0; i < order.length; i++) {
        const el = document.querySelector<HTMLElement>(`[data-key="${order[i].key}"]`);
        if (!el) continue;
        const r = el.getBoundingClientRect();
        const midY = r.top + r.height / 2;
        const midX = r.left + r.width / 2;
        // 鼠标完全在该卡上方 → 插到它前面
        if (my < midY - r.height / 2) {
          idx = i;
          break;
        }
        // 鼠标与该卡同一行 → 比较水平位置（中心左侧插前，右侧继续）
        if (Math.abs(my - midY) <= r.height / 2) {
          if (mx <= midX) {
            idx = i;
            break;
          }
          continue;
        }
      }
      setPlaceholderIndex(idx);
    };
    const onUp = () => {
      handleDropRef.current();
    };
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
    return () => {
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
    };
  }, [dragKey, allItems, visibleItems]);

  // 拖拽手柄：mousedown 拿起卡片（记录浮层几何 + 初始占位），preventDefault 抑制点击跳转
  const startDrag = (key: string) => (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const card = (e.currentTarget as HTMLElement).closest<HTMLElement>('.cube-home-widget, .cube-home-kpi-card');
    const r = card?.getBoundingClientRect();
    if (!r) return;
    setDragKey(key);
    setDragPos({ x: r.left, y: r.top, w: r.width, h: r.height, ox: e.clientX - r.left, oy: e.clientY - r.top });
    // 初始占位 = 被拖卡原位置（同组内，拖起瞬间原位置立即腾出占位框）
    const dragItem = allItems.find((it) => it.key === key);
    const kind = dragItem?.kind;
    const orderAll = visibleItems.filter((it) => it.kind === kind);
    setPlaceholderIndex(orderAll.findIndex((it) => it.key === key));
  };

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

  /** 登录与在线部件正文：最近登录、在线用户上下分段，各显示少量行（对齐 MVC LoginLog.cshtml 上下两块） */
  const renderLoginLogBody = (data?: DashboardLoginLog): ReactNode => (
    <div className="cube-home-login">
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
      <div className="cube-home-profile-table">
        <div className="cube-home-profile-row">
          <span className="cube-home-profile-k">账号</span>
          <span className="cube-home-profile-v">{p?.name ?? '—'}</span>
        </div>
        <div className="cube-home-profile-row">
          <span className="cube-home-profile-k">状态</span>
          <span className="cube-home-profile-v">
            <span className={`cube-online-dot${p?.online ? ' on' : ''}`} />
            {p?.online ? '在线' : '离线'}
          </span>
        </div>
        <div className="cube-home-profile-row">
          <span className="cube-home-profile-k">登录次数</span>
          <span className="cube-home-profile-v">{p?.logins ?? '—'} 次</span>
        </div>
        <div className="cube-home-profile-row">
          <span className="cube-home-profile-k">上次登录</span>
          <span className="cube-home-profile-v">{p?.lastLogin || '—'}</span>
        </div>
        <div className="cube-home-profile-row">
          <span className="cube-home-profile-k">上次地址</span>
          <span className="cube-home-profile-v">{p?.lastLoginIP || '—'}</span>
        </div>
        <div className="cube-home-profile-row">
          <span className="cube-home-profile-k">注册时间</span>
          <span className="cube-home-profile-v">{p?.registerTime || '—'}</span>
        </div>
      </div>
      <div className="cube-home-profile-more">
        <a role="button" onClick={() => navigate('/profile')}>
          个人中心 »
        </a>
      </div>
    </div>
  );

  /** 系统信息部件正文：两列信息网格（键小字灰 + 值重点，悬浮完整值） */
  const renderSysInfoBody = (data?: Record<string, unknown>): ReactNode =>
    data ? (
      <div className="cube-home-sys-grid">
        {Object.entries(data).map(([k, v]) => (
          <div key={k} className="cube-home-sys-item" title={String(v ?? '')}>
            <span className="cube-home-sys-key">{k}</span>
            <span className="cube-home-sys-value">{String(v ?? '')}</span>
          </div>
        ))}
      </div>
    ) : null;

  /** 键值字典正文（未知名部件兜底） */
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
        return renderSysInfoBody(data);
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

  // 拖拽浮层数据（被拖卡 + 分组）
  const dragItem = dragKey ? allItems.find((it) => it.key === dragKey) : undefined;
  const dragKind = dragItem?.kind;

  /** KPI 卡内部内容：头部（图标 + 数值同排）+ 名字 + 趋势（普通渲染与拖拽浮层共用）
   *  头部为图标+数值横向，预留右侧操作区空间，数值不顶到三点/十字；名字/趋势单行省略 + title 悬浮完整 */
  const renderKpiInner = (item: HomeItem): ReactNode => {
    const k = item.kpi!;
    const trend = k.trend || '';
    return (
      <>
        <span className="cube-home-kpi-actions">
          <Dropdown
            trigger={['click']}
            menu={{ items: [{ key: 'hide', icon: <EyeInvisibleOutlined />, label: '隐藏', onClick: () => handleHide(item.key) }] }}
          >
            <Button type="text" size="small" icon={<MoreOutlined />} />
          </Dropdown>
          <span className="cube-kpi-drag-handle" title="拖动排序" onMouseDown={startDrag(item.key)}>
            <DragOutlined />
          </span>
        </span>
        <div className="cube-home-kpi-head">
          <div className={`cube-home-kpi-icon ${k.color || 'blue'}`}>{KPI_ICONS[k.name ?? ''] ?? null}</div>
          <div className="cube-home-kpi-value" title={k.value}>
            {k.value}
          </div>
        </div>
        <div className="cube-home-kpi-label" title={k.label}>
          {k.label}
        </div>
        {trend && (
          <div className="cube-home-kpi-trend" title={trend}>
            {trend}
          </div>
        )}
      </>
    );
  };

  /** KPI 卡（普通网格项） */
  const renderKpiCard = (item: HomeItem): ReactNode => {
    const k = item.kpi!;
    return (
      <div
        key={item.key}
        data-key={item.key}
        className="cube-home-kpi-card"
        style={k.url ? { cursor: 'pointer' } : undefined}
        onClick={(e) => {
          // 拖拽十字 / 隐藏菜单（含 antd 弹层 portal，事件按组件树冒泡到卡片）不触发卡片跳转
          const target = e.target as HTMLElement;
          if (target.closest('.cube-home-kpi-actions') || target.closest('.ant-dropdown')) return;
          if (k.url) navigate(k.url);
        }}
      >
        {renderKpiInner(item)}
      </div>
    );
  };

  /** 内容部件内部（antd Card，普通渲染与拖拽浮层共用） */
  const renderWidgetInner = (item: HomeItem): ReactNode => {
    const w = item.widget!;
    return (
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
              menu={{ items: [{ key: 'hide', icon: <EyeInvisibleOutlined />, label: '隐藏卡片', onClick: () => handleHide(item.key) }] }}
            >
              <Button type="text" size="small" icon={<MoreOutlined />} />
            </Dropdown>
            <span className="cube-widget-drag-handle" title="拖动排序" onMouseDown={startDrag(item.key)}>
              <DragOutlined />
            </span>
          </span>
        }
      >
        {renderWidgetBody(w)}
      </Card>
    );
  };

  /** 内容部件卡（普通网格项） */
  const renderWidgetCard = (item: HomeItem): ReactNode => (
    <div key={item.key} data-key={item.key} className="cube-home-widget" style={{ gridColumn: `span ${item.cols}` }}>
      {renderWidgetInner(item)}
    </div>
  );

  /** 网格渲染：排除被拖卡，目标位置实时插入虚线占位框（对齐 MVC ui-sortable-placeholder） */
  const renderGrid = (): ReactNode => {
    if (!visibleItems.length)
      return (
        <div style={{ gridColumn: '1 / -1' }}>
          <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="暂无卡片" />
        </div>
      );
    const list: ReactNode[] = [];
    let kpiN = 0;
    let widgetN = 0;
    let lastKpiCols = 2;
    let lastWidgetCols = 4;
    visibleItems.forEach((item) => {
      if (item.key === dragKey) return;
      const isKpi = item.kind === 'kpi';
      const gIdx = isKpi ? kpiN : widgetN;
      if (isKpi) {
        kpiN++;
        lastKpiCols = item.cols || 2;
      } else {
        widgetN++;
        lastWidgetCols = item.cols || 4;
      }
      // 占位：同组内、组内序号命中占位索引 → 在该卡前插入虚线占位框
      if (dragKey && item.kind === dragKind && gIdx === placeholderIndex) {
        list.push(
          <div key={`ph-${item.key}`} className="cube-home-drag-placeholder" style={{ gridColumn: `span ${isKpi ? 2 : item.cols}` }} />,
        );
      }
      list.push(isKpi ? renderKpiCard(item) : renderWidgetCard(item));
    });
    // 末尾占位：占位索引 == 组内数量（拖到组尾）
    if (dragKey && dragKind && placeholderIndex >= (dragKind === 'kpi' ? kpiN : widgetN)) {
      list.push(
        <div
          key="ph-end"
          className="cube-home-drag-placeholder"
          style={{ gridColumn: `span ${dragKind === 'kpi' ? lastKpiCols : lastWidgetCols}` }}
        />,
      );
    }
    return <>{list}</>;
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

      {/* 12 列部件栅格：KPI 卡直接排布（span 2）+ 内容部件（span=cols），MVC 式实时占位拖动排序 / 隐藏 */}
      <div className="cube-home-grid">{renderGrid()}</div>

      {/* 拖拽浮层：拿起跟随鼠标（pointer-events none 不拦截交互），目标位置已由占位框腾出 */}
      {dragKey && dragPos && dragItem && (
        <div className="cube-home-dragging-card" style={{ left: dragPos.x, top: dragPos.y, width: dragPos.w, height: dragPos.h }}>
          {dragKind === 'kpi' ? renderKpiInner(dragItem) : renderWidgetInner(dragItem)}
        </div>
      )}
    </div>
  );
}
