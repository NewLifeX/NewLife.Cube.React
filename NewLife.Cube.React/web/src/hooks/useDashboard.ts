/**
 * 工作台数据 Hook（命名与 MVC 版工作台统一为 Dashboard，视图 Index/Dashboard）
 *
 * 优先请求后端聚合接口 `/Admin/Index/Dashboard`（HOME-3），
 * 接口不可用时自动降级为空数据（页面继续用菜单/用户信息渲染，不白屏）。
 */
import { useCallback, useEffect, useState } from 'react';
import { api } from '@/api';

/** 工作台 KPI 卡 */
export interface DashboardKpi {
  /** 语义名（用于图标映射：users/login/online/log/error/cpu） */
  name?: string;
  /** 标题 */
  label: string;
  /** 数值 */
  value: string;
  /** 趋势/说明文案 */
  trend?: string;
  /** 点击跳转 */
  url?: string;
  /** 图标配色（blue/green/cyan/orange/red/purple/grey） */
  color?: string;
}

/** 快捷入口 */
export interface DashboardQuickLink {
  name: string;
  url: string;
  icon?: string;
}

/** 个人资料（Dashboard 接口 profile 字段） */
export interface DashboardProfile {
  name?: string;
  displayName?: string;
  roleNames?: string;
  online?: boolean;
  logins?: number;
  lastLogin?: string;
  lastLoginIP?: string;
  registerTime?: string;
}

/** 登录与在线（LoginLog 部件数据） */
export interface DashboardLoginLog {
  logins?: {
    createTime?: string;
    userName?: string;
    action?: string;
    createIP?: string;
  }[];
  onlines?: {
    name?: string;
    createTime?: string;
    oAuthProvider?: string;
  }[];
}

/** 快捷入口部件数据（QuickLink） */
export interface DashboardQuickLinkData {
  links?: DashboardQuickLink[];
}

/**
 * 内容部件（KPI 以外，由后端 WidgetManager 驱动，对齐 MVC WidgetAttribute）
 * data 按 widgetType 解释：Content=业务数据 / Kv=键值字典 / Chart=null（前端独立轮询 MonitorData）
 */
export interface DashboardWidget {
  /** 部件名（Monitor/SysInfo/LoginLog/QuickLink/Profile...） */
  name: string;
  /** 标题 */
  title: string;
  /** FontAwesome 图标名（fa-line-chart 等，resolveIcon 转换） */
  icon?: string;
  /** 栅格宽度 1-12 */
  cols: number;
  /** 分组/分类（系统/个人/通用/业务模块名） */
  category?: string;
  /** 部件类型（Kpi/Content/Html/Kv/Chart） */
  widgetType: string;
  /** 部件数据（Chart 为 null） */
  data?: Record<string, unknown> | DashboardLoginLog | DashboardQuickLinkData | DashboardProfile | null;
}

/** 工作台聚合数据 */
export interface DashboardData {
  user?: {
    name?: string;
    displayName?: string;
    roles?: string[];
  };
  /** 可见 KPI 指标（MVC Widget 部件驱动） */
  kpis?: DashboardKpi[];
  /** 用户已隐藏的 KPI 指标（供恢复面板） */
  hiddenKpis?: DashboardKpi[];
  /** 可见内容部件（非 KPI，含元数据与数据） */
  widgets?: DashboardWidget[];
  /** 用户已隐藏的内容部件（供恢复面板） */
  hiddenWidgets?: DashboardWidget[];
  quickLinks?: DashboardQuickLink[];
  profile?: DashboardProfile;
  sysInfo?: Record<string, string>;
}

export interface UseDashboardResult {
  data: DashboardData | null;
  loading: boolean;
  reload: () => Promise<void>;
}

/**
 * 加载工作台聚合数据
 *
 * @returns 工作台数据 / 加载状态 / 刷新函数
 */
export function useDashboard(): UseDashboardResult {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.client.get('/Admin/Index/Dashboard');
      const body = res.data as { data?: DashboardData };
      if (body?.data) {
        setData(body.data);
        return;
      }
    } catch {
      // 接口不可用（旧版后端）：降级为空数据
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  return { data, loading, reload: load };
}

export default useDashboard;
