/**
 * 用户详情页（/Admin/User/Detail/:id）
 *
 * 对齐主流身份平台（Auth0/Okta/Keycloak/Ant Design Pro）的用户详情结构：
 * 左侧用户摘要 + 右侧关联维度 Tab。关联维度由后端 meta.ui.userCard 下发，
 * 旧版后端缺失契约时使用 skin 内置 fallback。
 */
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import {
  Avatar,
  Button,
  Card,
  Descriptions,
  Result,
  Skeleton,
  Space,
  Tabs,
  Tag,
  Typography,
} from 'antd';
import {
  ArrowLeftOutlined,
  BellOutlined,
  EditOutlined,
  FileTextOutlined,
  HistoryOutlined,
  IdcardOutlined,
  KeyOutlined,
  LaptopOutlined,
  LinkOutlined,
  ReloadOutlined,
  SafetyCertificateOutlined,
  UserOutlined,
} from '@ant-design/icons';
import type { PageMeta } from '@newlifex/cube';
import { api } from '@/api';
import { t } from '@/i18n';
import { useTabsStore } from '@/stores/tabs';
import { useUserInfo } from '@/stores/user';
import { getValueByKey } from '@/utils/url';
import { formatDateTime, formatDetailValue } from '@/views/form/detailValue';
import { formatTimeSpan } from '@/utils/numberFormat';
import { toFieldMeta } from '@/types/field';
import EntityListPage from '@/views/list/EntityListPage';
import { relationQuery, relationTitle, resolveUserCard } from './userCardMeta';

/** 详情加载错误类型 */
type DetailError = 'notfound' | 'failed' | null;

/** 关联维度图标 */
function relationIcon(icon?: string) {
  switch (icon) {
    case 'link':
      return <LinkOutlined />;
    case 'key':
      return <KeyOutlined />;
    case 'laptop':
      return <LaptopOutlined />;
    case 'file-text':
      return <FileTextOutlined />;
    case 'history':
      return <HistoryOutlined />;
    case 'bell':
      return <BellOutlined />;
    default:
      return <UserOutlined />;
  }
}

/** 头像地址：完整 URL/绝对路径直接使用，裸文件名回退到头像端点 */
function resolveAvatar(value: unknown, userId: string): string | undefined {
  const text = typeof value === 'string' ? value.trim() : '';
  if (!text) return undefined;
  if (/^https?:\/\//i.test(text) || text.startsWith('/')) return text;
  return `/Cube/Avatar?id=${encodeURIComponent(userId)}`;
}

/** 布尔值兼容 true/"true"/1 */
function isTrue(value: unknown): boolean {
  return value === true || value === 'true' || value === 1;
}

/**
 * 用户详情页
 *
 * @returns 页面节点
 */
export default function UserDetailPage() {
  const { id = '' } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams, setSearchParams] = useSearchParams();
  // 当前登录用户：查看本人时提供用户中心入口（对齐 MVC _User_Nav 的本人专属 Tab）
  const currentUser = useUserInfo();
  const isSelf = currentUser?.id != null && String(currentUser.id) === id;

  const [meta, setMeta] = useState<PageMeta | null>(null);
  const [detail, setDetail] = useState<Record<string, unknown> | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<DetailError>(null);
  const [reloadKey, setReloadKey] = useState(0);
  const [counts, setCounts] = useState<Record<string, number>>({});

  // 加载页面元数据与用户详情（meta 命中共享包缓存）
  useEffect(() => {
    if (!id) {
      setError('notfound');
      setLoading(false);
      return;
    }

    let cancelled = false;
    setLoading(true);
    setError(null);

    Promise.all([
      api.page.getPage('/Admin/User'),
      api.page.getDetail<Record<string, unknown>>('/Admin/User', id),
    ])
      .then(([metaRes, detailRes]) => {
        if (cancelled) return;
        setMeta(metaRes.data ?? null);
        setDetail(detailRes.data ?? {});
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        const status =
          (err as { response?: { status?: number } })?.response?.status ??
          (err as { code?: number })?.code;
        setError(status === 404 ? 'notfound' : 'failed');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [id, reloadKey]);

  const userCard = useMemo(() => resolveUserCard(meta?.ui), [meta?.ui]);

  const title = String(
    getValueByKey(detail ?? {}, userCard.titleField || 'DisplayName') ??
      getValueByKey(detail ?? {}, 'Name') ??
      id,
  );
  const subtitle = String(getValueByKey(detail ?? {}, userCard.subtitleField || 'Name') ?? '');
  const avatar = resolveAvatar(getValueByKey(detail ?? {}, userCard.avatarField || 'Avatar'), id);
  const enabled = getValueByKey(detail ?? {}, 'Enable');
  const online = getValueByKey(detail ?? {}, 'Online');
  const roleText = String(
    getValueByKey(detail ?? {}, 'RoleNames') ?? getValueByKey(detail ?? {}, 'RoleName') ?? '',
  );
  const roles = roleText
    .split(/[,，、/]/)
    .map((item) => item.trim())
    .filter(Boolean);
  const department = String(getValueByKey(detail ?? {}, 'DepartmentName') ?? '');

  const stats = [
    { label: t('登录次数'), value: String(getValueByKey(detail ?? {}, 'Logins') ?? '-') },
    { label: t('最近登录'), value: formatDateTime(getValueByKey(detail ?? {}, 'LastLogin')) || '-' },
    { label: t('注册时间'), value: formatDateTime(getValueByKey(detail ?? {}, 'RegisterTime')) || '-' },
    {
      label: t('在线时长'),
      value:
        formatTimeSpan(getValueByKey(detail ?? {}, 'OnlineTime'), {
          itemType: 'TimeSpan',
          description: '秒',
        }) || '-',
    },
  ];

  // 基本信息：按 detail 字段渲染，隐藏空值与头像（头像在页头展示）
  const basicItems = useMemo(() => {
    const items: { key: string; label: string; children: React.ReactNode }[] = [];
    for (const field of meta?.detail ?? []) {
      const fieldMeta = toFieldMeta(field);
      if (fieldMeta.name.toLowerCase() === 'avatar') continue;

      const value = getValueByKey(detail ?? {}, fieldMeta.name);
      if (value === null || value === undefined || value === '') continue;

      // 隐藏后端默认值造成的噪音：年龄 0、扩展字段 0、未填生日（DateTime.MinValue）
      if (/^ex\d+$/i.test(fieldMeta.name) && Number(value) === 0) continue;
      if (/^age$/i.test(fieldMeta.name) && Number(value) === 0) continue;
      if (/^birthday$/i.test(fieldMeta.name) && String(value).startsWith('0001-')) continue;

      items.push({
        key: fieldMeta.name,
        label: fieldMeta.displayName || fieldMeta.name,
        children: formatDetailValue(fieldMeta, value),
      });
    }
    return items;
  }, [meta?.detail, detail]);

  const handleRelationLoaded = useCallback((key: string, total: number) => {
    setCounts((prev) => (prev[key] === total ? prev : { ...prev, [key]: total }));
  }, []);

  // 关联维度查询条件（{id} 模板 → 当前用户主键），作为嵌入列表的固定过滤条件
  const relationQueries = useMemo(() => {
    const map: Record<string, Record<string, string>> = {};
    for (const relation of userCard.relations) map[relation.key] = relationQuery(relation, id);
    return map;
  }, [id, userCard.relations]);

  const tabItems = useMemo(() => {
    const items = [
      {
        key: 'basic',
        label: (
          <Space size={4}>
            <UserOutlined />
            {t('基本信息')}
          </Space>
        ),
        children: (
          <Descriptions
            bordered
            size="small"
            column={{ xs: 1, sm: 2 }}
            items={basicItems}
            className="cube-user-basic"
            styles={{ label: { width: 108, whiteSpace: 'nowrap' } }}
          />
        ),
      },
    ];

    for (const relation of userCard.relations) {
      if (relation.key === 'basic') continue;
      const count = counts[relation.key];
      items.push({
        key: relation.key,
        label: (
          <Space size={4}>
            {relationIcon(relation.icon)}
            {relationTitle(relation)}
            {count != null && <span className="cube-user-detail-count">{count}</span>}
          </Space>
        ),
        // 直接嵌入该维度的原列表页：搜索、排序、分页、查看详情弹窗与「查看全部」页完全一致
        children: (
          <EntityListPage
            key={`${relation.key}-${id}`}
            type={relation.entity}
            baseQuery={relationQueries[relation.key]}
            embedded
            onLoaded={(total) => handleRelationLoaded(relation.key, total)}
          />
        ),
      });
    }
    return items;
  }, [basicItems, counts, handleRelationLoaded, id, relationQueries, userCard.relations]);

  const requestedTab = searchParams.get('tab') || 'basic';
  const activeKey = tabItems.some((item) => item.key === requestedTab) ? requestedTab : 'basic';

  const handleTabChange = (key: string) => {
    const next = new URLSearchParams(searchParams);
    if (key === 'basic') next.delete('tab');
    else next.set('tab', key);
    setSearchParams(next, { replace: true });
  };

  const from = searchParams.get('from') || '';
  const goBack = () => {
    const target =
      from.startsWith('/Admin/User') && !/^\/Admin\/User\/Detail(\/|$)/i.test(from)
        ? from
        : '/Admin/User';
    navigate(target);
  };

  // 多标签标题回填为用户昵称（TabsView 先按路由标题“用户详情”建标签）
  useEffect(() => {
    if (!detail) return;
    const name = String(
      getValueByKey(detail, userCard.titleField || 'DisplayName') ?? getValueByKey(detail, 'Name') ?? '',
    ).trim();
    if (!name) return;

    useTabsStore.getState().addTab({
      path: location.pathname,
      title: `${t('用户详情')} - ${name}`,
      closable: true,
    });
  }, [detail, location.pathname, userCard.titleField]);

  if (loading) {
    return (
      <Card className="cube-entity-card cube-user-detail" size="small">
        <Skeleton active paragraph={{ rows: 10 }} />
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="cube-entity-card cube-user-detail" size="small">
        <Result
          status={error === 'notfound' ? '404' : 'warning'}
          title={error === 'notfound' ? t('用户不存在') : t('加载详情失败')}
          subTitle={error === 'notfound' ? undefined : t('网络错误，请稍后重试')}
          extra={
            <Space>
              <Button onClick={goBack}>{t('返回用户列表')}</Button>
              {error !== 'notfound' && (
                <Button type="primary" onClick={() => setReloadKey((key) => key + 1)}>
                  {t('刷新')}
                </Button>
              )}
            </Space>
          }
        />
      </Card>
    );
  }

  return (
    <Card className="cube-entity-card cube-user-detail" size="small" styles={{ body: { paddingTop: 10 } }}>
      <div className="cube-user-detail-header">
        <Space size={8} align="center">
          <Button type="text" size="small" icon={<ArrowLeftOutlined />} onClick={goBack}>
            {t('返回用户列表')}
          </Button>
          <span className="cube-user-detail-divider" />
          <span className="cube-user-detail-header-title">{t('用户详情')}</span>
          <Typography.Text type="secondary">#{id}</Typography.Text>
        </Space>
        <Space size={8}>
          <Button icon={<ReloadOutlined />} onClick={() => setReloadKey((key) => key + 1)}>
            {t('刷新')}
          </Button>
          {isSelf && (
            <>
              <Button icon={<IdcardOutlined />} onClick={() => navigate('/profile')}>
                {t('个人资料')}
              </Button>
              <Button icon={<SafetyCertificateOutlined />} onClick={() => navigate('/profile/security')}>
                {t('安全中心')}
              </Button>
            </>
          )}
          <Button
            type="primary"
            icon={<EditOutlined />}
            onClick={() => navigate(`/Admin/User/Edit?id=${encodeURIComponent(id)}`)}
          >
            {t('编辑')}
          </Button>
        </Space>
      </div>

      <div className="cube-user-detail-body">
        <aside className="cube-user-detail-aside">
          <div className="cube-user-detail-profile">
            <Avatar size={92} src={avatar} className="cube-user-detail-avatar">
              {title.slice(0, 1)}
            </Avatar>
            <div className="cube-user-detail-profile-main">
              <div className="cube-user-detail-title" title={title}>
                {title}
              </div>
              {subtitle && subtitle !== title && <div className="cube-user-detail-subtitle">@{subtitle}</div>}

              <div className="cube-user-detail-tags">
                <Tag color={isTrue(enabled) ? 'success' : 'default'}>
                  {isTrue(enabled) ? t('启用') : t('禁用')}
                </Tag>
                <Tag color={isTrue(online) ? 'processing' : 'default'}>{isTrue(online) ? t('在线') : t('离线')}</Tag>
                {department && <Tag>{department}</Tag>}
                {roles.map((role) => (
                  <Tag key={role} color="blue">
                    {role}
                  </Tag>
                ))}
              </div>
            </div>
          </div>

          <div className="cube-user-detail-stats">
            {stats.map((item) => (
              <div key={item.label} className="cube-user-detail-stat">
                <span className="cube-user-detail-stat-label">{item.label}</span>
                <b className="cube-user-detail-stat-value" title={item.value}>
                  {item.value}
                </b>
              </div>
            ))}
          </div>
        </aside>

        <section className="cube-user-detail-main">
          <Tabs activeKey={activeKey} onChange={handleTabChange} items={tabItems} />
        </section>
      </div>
    </Card>
  );
}
