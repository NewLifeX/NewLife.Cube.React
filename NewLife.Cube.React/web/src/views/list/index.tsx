/**
 * 通用列表页（包装组件）
 *
 * 先探测当前控制器是否为实体 CRUD 页（meta 返回 JSON），再分发渲染：
 * - 实体页   → EntityListPage（原通用列表页，store 驱动）
 * - 配置页   → ConfigPage（ConfigController 对象表单，如魔方设置 /Admin/Cube）
 * - 数据库页 → DbPage（DbController 特殊管理页 /Admin/Db）
 *
 * 探测逻辑独立于列表渲染（本组件仅用普通 useState/useEffect，不含 zustand store hook），
 * 避免在同一组件内「早退 return + useSyncExternalStore」组合触发 React 310 hook 计数错误。
 */
import { useEffect, useState } from 'react';
import { Card, Spin } from 'antd';
import { useLocation } from 'react-router-dom';
import { routeToApiPrefix } from '@/utils/url';
import { isEntityMeta } from '@/utils/pageMeta';
import { api } from '@/api';
import EntityListPage from './EntityListPage';
import ConfigPage from '@/views/config/ConfigPage';
import DbPage from '@/views/db/DbPage';
import WidgetPage from '@/views/widget/WidgetPage';
import AreaPage from '@/views/area/AreaPage';
import ViewTracePage from '@/views/viewtrace/ViewTracePage';
import ServerInfoPage from '@/views/serverinfo/ServerInfoPage';

/** 页面种类：探测中 / 实体页 / 非实体页（配置或特殊页） */
type PageKind = 'probe' | 'entity' | 'special';

export default function DefaultListPage() {
  const location = useLocation();
  const type = routeToApiPrefix(location.pathname);
  const [kind, setKind] = useState<PageKind>('probe');

  // 探测：meta 含列表字段说明是实体 CRUD 页；配置页/ObjectController 的 meta 只有 setting+editForm
  useEffect(() => {
    let cancelled = false;
    setKind('probe');
    // 已知特殊页（如服务器信息 /Admin/Index/Main）不探测 meta，直接按特殊页分发
    if (type.toLowerCase().endsWith('/index/main')) {
      setKind('special');
      return;
    }
    api.page
      .getPage(type)
      .then((res) => {
        if (cancelled) return;
        setKind(isEntityMeta(res) ? 'entity' : 'special');
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        // 后端对未匹配的 /api 请求统一返回 404；其余错误（401/403/5xx/网络）仍按实体页处理，避免瞬时故障误分流
        const status = (err as { response?: { status?: number } })?.response?.status;
        setKind(status === 404 ? 'special' : 'entity');
      });
    return () => {
      cancelled = true;
    };
  }, [type]);

  // 非实体页：按路径分发（数据库页 / 工作台部件 / 服务器信息 / 通用配置页）
  if (kind === 'special') {
    if (type.toLowerCase().endsWith('/db')) {
      return <DbPage type={type} />;
    }
    if (type.toLowerCase().endsWith('/cube/widget') || type.toLowerCase().endsWith('/widget')) {
      return <WidgetPage type={type} />;
    }
    if (type.toLowerCase().endsWith('/cube/viewtrace') || type.toLowerCase().endsWith('/viewtrace')) {
      return <ViewTracePage type={type} />;
    }
    if (type.toLowerCase().endsWith('/index/main')) {
      return <ServerInfoPage />;
    }
    return <ConfigPage type={type} />;
  }

  // 实体页：地区页走列表|地图双模式，其余渲染原通用列表页
  if (kind === 'entity') {
    if (type.toLowerCase().endsWith('/cube/area')) {
      return <AreaPage key={type} type={type} />;
    }
    return <EntityListPage key={type} type={type} />;
  }

  // 探测中：加载占位，避免空白闪屏
  return (
    <Card size="small" styles={{ body: { display: 'flex', justifyContent: 'center', padding: 48 } }}>
      <Spin />
    </Card>
  );
}
