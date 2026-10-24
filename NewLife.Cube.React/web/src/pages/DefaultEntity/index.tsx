/**
 * 动态实体页（catch-all）
 *
 * 对齐 Vue 皮肤 DefaultEntity.vue：根据当前路径在菜单树中匹配，
 * 命中 → 渲染通用列表页；表单类 URL（含 ?id= 或 /Edit 等后缀）→ 渲染表单页；未命中 → 404。
 */
import { useEffect, useMemo, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { Card, Spin } from 'antd';
import { useMenuStore } from '@/stores/menu';
import DefaultListPage from '@/views/list';
import FormPage from '@/views/form/FormPage';
import NotFoundPage from '@/pages/NotFound';
import ConfigNav, { findConfigCenter } from '@/views/config/ConfigNav';
import { routeToApiPrefix } from '@/utils/url';
import { isEntityMeta } from '@/utils/pageMeta';
import { isSpecialApiPath } from '@/utils/specialPage';
import { api } from '@/api';

/** 是否表单类路径（含 ?id= 或 /Edit /Add /New /Detail 后缀） */
function isFormPath(pathname: string, search: string): boolean {
  if (search.includes('id=')) return true;
  return /\/+(edit|add|new|detail)$/i.test(pathname);
}

export default function DefaultEntityPage() {
  const location = useLocation();
  // 订阅 flatMenus 而非 findMenu：findMenu 引用稳定不会触发重渲染，
  // 若菜单异步加载晚于本组件首次渲染，需在菜单就绪后重新匹配（否则误判 404）
  const flatMenus = useMenuStore((s) => s.flatMenus);
  const findMenu = useMenuStore((s) => s.findMenu);

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const matched = useMemo(() => findMenu(location.pathname), [findMenu, flatMenus, location.pathname]);
  // 配置中心路径：配置控制器在左侧菜单隐藏，菜单树中不存在，需按静态清单特判
  const config = useMemo(() => findConfigCenter(location.pathname), [location.pathname]);

  // 隐藏菜单实体页（如 /Admin/UserOnline、/Admin/UserStat，控制器 [Menu(0,false)] 不在菜单树）：
  // 菜单未命中时探测后端 meta，含列表字段即按实体页渲染，否则 404
  const [probe, setProbe] = useState<'idle' | 'ok' | 'none'>('idle');
  useEffect(() => {
    if (matched || config) return;
    // 已知特殊页（如服务器信息 /Admin/Index/Main）：不探测 meta，直接放行给 DefaultListPage 按路径分发
    if (isSpecialApiPath(location.pathname)) {
      setProbe('ok');
      return;
    }
    let cancelled = false;
    setProbe('idle');
    api.page
      .getPage(routeToApiPrefix(location.pathname))
      .then((res) => {
        if (cancelled) return;
        // 配置页/ObjectController 的 meta 也只有 JSON，必须以是否含列表字段区分
        setProbe(isEntityMeta(res) ? 'ok' : 'none');
      })
      .catch(() => {
        if (!cancelled) setProbe('none');
      });
    return () => {
      cancelled = true;
    };
  }, [matched, config, location.pathname]);

  if (!matched && !config) {
    // 探测中：加载占位
    if (probe === 'idle') {
      return (
        <Card size="small" styles={{ body: { display: 'flex', justifyContent: 'center', padding: 48 } }}>
          <Spin />
        </Card>
      );
    }
    // 后端无此实体 → 404
    if (probe === 'none') return <NotFoundPage />;
    // 隐藏菜单实体页命中（meta 返回 JSON）或特殊页放行 → 按列表页渲染（DefaultListPage 内部再探测分发）
  }

  const title = config?.label || matched?.title || matched?.name || '';

  // 表单类路径（编辑/新增/详情）→ 表单页；列表/配置页 → 通用列表页
  const content = isFormPath(location.pathname, location.search) ? (
    <FormPage key={location.pathname + location.search} title={title} />
  ) : (
    <DefaultListPage key={matched?.path || config?.path || location.pathname} />
  );

  // 配置中心页：顶部渲染切换器（基本设置/系统设置/星尘设置/数据中间件/魔方设置 + 更多配置）
  if (config) {
    return (
      <>
        <ConfigNav currentPath={location.pathname} />
        {content}
      </>
    );
  }

  return content;
}
