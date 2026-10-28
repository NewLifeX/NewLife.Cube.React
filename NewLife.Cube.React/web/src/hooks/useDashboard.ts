/**
 * 工作台数据 Hook（命名与 MVC 版工作台统一为 Dashboard，视图 Index/Dashboard）
 *
 * 数据加载与监控轮询统一走共享包 `createWorkbenchLoader`（@newlifex/cube），
 * 皮肤只保留状态与渲染；接口不可用时自动降级为空数据（页面继续用菜单/用户信息渲染，不白屏）。
 */
import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  createWorkbenchLoader,
  type MonitorPoint,
  type WorkbenchData,
  type WorkbenchKpi,
  type WorkbenchQuickLink,
  type WorkbenchWidget,
} from '@newlifex/cube';
import { api } from '@/api';

/** 工作台 KPI 卡（共享契约 `WorkbenchKpi`） */
export type DashboardKpi = WorkbenchKpi;

/** 快捷入口（共享契约 `WorkbenchQuickLink`） */
export type DashboardQuickLink = WorkbenchQuickLink;

/** 个人资料（共享契约 `WorkbenchData` 的 profile 节点） */
export type DashboardProfile = NonNullable<WorkbenchData['profile']>;

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
 * 内容部件（共享契约 `WorkbenchWidget`，对齐 MVC WidgetAttribute）
 * data 按 widgetType 解释：Content=业务数据 / Kv=键值字典 / Chart=null（前端独立轮询 MonitorData）
 */
export type DashboardWidget = WorkbenchWidget;

/** 工作台聚合数据（共享契约 `WorkbenchData`） */
export type DashboardData = WorkbenchData;

export interface UseDashboardResult {
  data: DashboardData | null;
  loading: boolean;
  reload: () => Promise<void>;
  /** 拉取一次监控快照（共享 loader，已解析为 `MonitorPoint`） */
  pollMonitor: () => Promise<MonitorPoint | null>;
}

/**
 * 加载工作台聚合数据
 *
 * @returns 工作台数据 / 加载状态 / 刷新函数 / 监控轮询函数
 */
export function useDashboard(): UseDashboardResult {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const loader = useMemo(() => createWorkbenchLoader(api), []);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await loader.load();
      if (res.data) setData(res.data);
    } catch {
      // 接口不可用（旧版后端）：降级为空数据
    } finally {
      setLoading(false);
    }
  }, [loader]);

  useEffect(() => {
    void load();
  }, [load]);

  return { data, loading, reload: load, pollMonitor: loader.pollMonitor };
}

export default useDashboard;
