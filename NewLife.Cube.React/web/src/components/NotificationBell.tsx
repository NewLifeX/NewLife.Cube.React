/**
 * 通知铃铛（CMP-13 未读闭环）
 *
 * 顶栏入口：显示未读数角标，点击展开最近未读列表，支持单条标记已读与全部已读。
 * 数据源默认走 `/Cube/Notice/*` 约定端点（见 `rendering/noticeProvider.ts`），
 * 端点未实现时静默降级为「暂无通知」，不影响页面其它功能。
 */
import { useCallback, useEffect, useRef, useState } from 'react';
import { Badge, Button, Dropdown, Empty, Spin } from 'antd';
import { BellOutlined } from '@ant-design/icons';
import { t } from '@/i18n';
import { getNoticeProvider } from '@/rendering/noticeProvider';
import type { NoticeItem, NoticeProvider } from '@/rendering/noticeProvider';

export interface NotificationBellProps {
  /** 是否显示文字标签 */
  showLabel?: boolean;
  /** 按钮文本 */
  label?: string;
  /** 外部指定数据源；不传时取全局注册的数据源 */
  provider?: NoticeProvider;
  /** 轮询间隔（毫秒），0 表示不轮询（也不预拉，首次展开时才请求） */
  pollInterval?: number;
}

export default function NotificationBell({
  showLabel,
  label = t('通知'),
  provider,
  pollInterval = 0,
}: NotificationBellProps) {
  const [count, setCount] = useState(0);
  const [items, setItems] = useState<NoticeItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const mounted = useRef(true);

  const load = useCallback(async () => {
    const source = provider ?? getNoticeProvider();
    setLoading(true);
    try {
      const summary = await source.unread();
      if (!mounted.current) return;
      setCount(summary.count);
      setItems(summary.items);
    } catch {
      // 端点未实现（404/405）或网络异常：静默降级，不打扰用户
      if (!mounted.current) return;
      setCount(0);
      setItems([]);
    } finally {
      if (mounted.current) setLoading(false);
    }
  }, [provider]);

  useEffect(() => {
    mounted.current = true;
    // 默认不预拉：后端通知中心未实现时，每页一个 404 会污染控制台与 E2E 断言。
    // 配了轮询间隔（业务已提供数据源）时才在加载后主动拉取
    if (pollInterval > 0) void load();
    if (pollInterval <= 0) {
      return () => {
        mounted.current = false;
      };
    }
    const timer = window.setInterval(() => void load(), pollInterval);
    return () => {
      mounted.current = false;
      window.clearInterval(timer);
    };
  }, [load, pollInterval]);

  const markRead = async (item: NoticeItem) => {
    const source = provider ?? getNoticeProvider();
    try {
      await source.read(item.id);
    } catch {
      // 标记失败不阻断跳转
    }
    if (item.url) window.location.href = item.url;
    void load();
  };

  const markAllRead = async () => {
    const source = provider ?? getNoticeProvider();
    try {
      await source.readAll();
    } catch {
      // 静默
    }
    void load();
  };

  const menu = {
    items: [
      {
        key: '__list',
        label: (
          <div className="cube-notice-list" style={{ width: 280 }}>
            {loading && items.length === 0 ? (
              <div style={{ padding: 16, textAlign: 'center' }}>
                <Spin size="small" />
              </div>
            ) : items.length === 0 ? (
              <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description={t('暂无通知')} />
            ) : (
              items.map((item) => (
                <div
                  key={item.id}
                  className="cube-notice-item"
                  style={{ padding: '6px 4px', cursor: 'pointer' }}
                  onClick={() => void markRead(item)}
                >
                  <div style={{ fontWeight: 500 }}>{item.title}</div>
                  {item.content && (
                    <div style={{ fontSize: 12, opacity: 0.65, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {item.content}
                    </div>
                  )}
                  {item.time && <div style={{ fontSize: 12, opacity: 0.45 }}>{item.time}</div>}
                </div>
              ))
            )}
          </div>
        ),
      },
      ...(count > 0
        ? [
            { type: 'divider' as const },
            {
              key: '__all',
              label: t('全部已读'),
              onClick: () => void markAllRead(),
            },
          ]
        : []),
    ],
  };

  return (
    <Dropdown
      menu={menu}
      trigger={['click']}
      placement="bottomRight"
      open={open}
      onOpenChange={(next) => {
        // 先拉数据再展开：保证下拉内容是最新未读，避免先看到旧的「暂无通知」
        if (next) {
          void load().finally(() => setOpen(true));
        } else {
          setOpen(false);
        }
      }}
    >
      <Badge count={count} size="small">
        {/* 可访问名：showLabel 时取文字标签，否则取默认「通知」 */}
        <Button
          type="text"
          className="cube-header-action"
          icon={<BellOutlined />}
          aria-label={showLabel ? label : t('通知')}
          title={t('通知')}
        >
          {showLabel ? label : null}
        </Button>
      </Badge>
    </Dropdown>
  );
}
