/**
 * NotificationBell 通知铃铛单元测试（CMP-13 未读闭环）
 *
 * 覆盖：按钮与可访问名、未读角标、下拉空状态、未读列表与标记已读、
 * 全部已读、数据源异常时静默降级。
 */
import { describe, expect, it, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import NotificationBell from '../NotificationBell';
import type { NoticeProvider } from '@/rendering/noticeProvider';

/** 构造数据源：立即返回给定汇总，记录调用 */
function fakeProvider(count = 0, items: Awaited<ReturnType<NoticeProvider['unread']>>['items'] = []): NoticeProvider & {
  read: ReturnType<typeof vi.fn>;
  readAll: ReturnType<typeof vi.fn>;
} {
  return {
    unread: vi.fn().mockResolvedValue({ count, items }),
    read: vi.fn().mockResolvedValue(undefined),
    readAll: vi.fn().mockResolvedValue(undefined),
  };
}

describe('NotificationBell 通知铃铛', () => {
  it('渲染铃铛按钮（默认可访问名「通知」）', () => {
    render(<NotificationBell provider={fakeProvider()} pollInterval={0} />);
    expect(screen.getByRole('button', { name: /通知/ })).toBeInTheDocument();
  });

  it('showLabel 时显示文字标签', () => {
    render(<NotificationBell provider={fakeProvider()} pollInterval={0} showLabel label="消息" />);
    // antd Button 中文自动插空格（"消 息"）
    expect(screen.getByRole('button', { name: /消\s*息/ })).toHaveTextContent(/消\s*息/);
  });

  it('未读数 > 0 时显示角标（配了轮询才会预拉）', async () => {
    render(<NotificationBell provider={fakeProvider(5)} pollInterval={60_000} />);
    await waitFor(() => expect(screen.getByText('5')).toBeInTheDocument());
  });

  it('点击展开下拉：无未读时显示空状态', async () => {
    render(<NotificationBell provider={fakeProvider(0)} pollInterval={0} />);
    fireEvent.click(screen.getByRole('button', { name: /通知/ }));
    await waitFor(() => expect(screen.getByText('暂无通知')).toBeInTheDocument());
  });

  it('展开后列出未读条目，点击条目调用 read', async () => {
    const provider = fakeProvider(1, [{ id: 7, title: '有新审批', content: '采购单待处理', time: '2026-10-24' }]);
    render(<NotificationBell provider={provider} pollInterval={60_000} />);
    await waitFor(() => expect(screen.getByText('1')).toBeInTheDocument());

    fireEvent.click(screen.getByRole('button', { name: /通知/ }));
    await waitFor(() => expect(screen.getByText('有新审批')).toBeInTheDocument());

    fireEvent.click(screen.getByText('有新审批'));
    await waitFor(() => expect(provider.read).toHaveBeenCalledWith(7));
  });

  it('「全部已读」调用 readAll', async () => {
    const provider = fakeProvider(2, [
      { id: 1, title: 'A' },
      { id: 2, title: 'B' },
    ]);
    render(<NotificationBell provider={provider} pollInterval={60_000} />);
    await waitFor(() => expect(screen.getByText('2')).toBeInTheDocument());

    fireEvent.click(screen.getByRole('button', { name: /通知/ }));
    await waitFor(() => expect(screen.getByText('全部已读')).toBeInTheDocument());

    fireEvent.click(screen.getByText('全部已读'));
    await waitFor(() => expect(provider.readAll).toHaveBeenCalledTimes(1));
  });

  it('数据源异常（端点未实现）时静默降级为空', async () => {
    const provider: NoticeProvider = {
      unread: vi.fn().mockRejectedValue(new Error('404')),
      read: vi.fn(),
      readAll: vi.fn(),
    };
    render(<NotificationBell provider={provider} pollInterval={0} />);
    fireEvent.click(screen.getByRole('button', { name: /通知/ }));
    await waitFor(() => expect(screen.getByText('暂无通知')).toBeInTheDocument());
  });
});
