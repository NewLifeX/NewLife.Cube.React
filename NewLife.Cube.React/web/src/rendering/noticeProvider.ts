/**
 * 通知数据源（CMP-13 未读闭环）
 *
 * 皮肤只依赖一组最小契约，默认走后端约定端点；业务可通过 `registerNoticeProvider`
 * 替换数据源（如接入自有消息中心），未注册时使用 `defaultNoticeProvider`。
 *
 * 契约（后端实现后即自动生效，端点缺失时前端静默降级）：
 * - `GET  {base}/Unread`    → `{ code:0, data:{ count, items:[{ id, title, content?, time?, url?, read? }] } }`
 * - `POST {base}/Read?id=`  → `{ code:0 }`
 * - `POST {base}/ReadAll`   → `{ code:0 }`
 */
import { api } from '@/api';

/** 通知条目 */
export interface NoticeItem {
  /** 唯一标识 */
  id: number;
  /** 标题 */
  title: string;
  /** 内容摘要 */
  content?: string;
  /** 时间（后端原样字符串） */
  time?: string;
  /** 点击跳转地址 */
  url?: string;
  /** 是否已读 */
  read?: boolean;
}

/** 未读汇总 */
export interface NoticeSummary {
  /** 未读条数（0 时角标不显示） */
  count: number;
  /** 最近未读条目（建议不超过 10 条） */
  items: NoticeItem[];
}

/** 通知数据源 */
export interface NoticeProvider {
  /** 拉取未读汇总 */
  unread(): Promise<NoticeSummary>;
  /** 标记单条已读 */
  read(id: number): Promise<void>;
  /** 全部标记已读 */
  readAll(): Promise<void>;
}

/** 默认端点前缀。后端实现通知中心后无需改前端 */
export const defaultNoticeBase = '/Cube/Notice';

/** 默认数据源：走约定 REST 端点 */
export const defaultNoticeProvider: NoticeProvider = {
  async unread() {
    // api-core 默认不解包（unwrapResponse=false）：res.data 是 ApiResponse，业务数据在其 .data
    const res = (await api.client.get(`${defaultNoticeBase}/Unread`)) as {
      data?: { data?: { count?: number; items?: NoticeItem[] }; count?: number; items?: NoticeItem[] };
    };
    const payload = res?.data?.data ?? res?.data ?? {};
    const data = payload as { count?: number; items?: NoticeItem[] };
    return { count: Number(data.count ?? 0), items: Array.isArray(data.items) ? data.items : [] };
  },
  async read(id: number) {
    await api.client.post(`${defaultNoticeBase}/Read`, null, { params: { id } });
  },
  async readAll() {
    await api.client.post(`${defaultNoticeBase}/ReadAll`);
  },
};

let _provider: NoticeProvider | null = null;

/**
 * 注册自定义通知数据源（业务侧接入自有消息中心），传 null 恢复默认
 *
 * @param provider 数据源实现
 */
export function registerNoticeProvider(provider: NoticeProvider | null) {
  _provider = provider;
}

/** 取当前通知数据源（未注册时返回默认实现） */
export function getNoticeProvider(): NoticeProvider {
  return _provider ?? defaultNoticeProvider;
}

/** 清空自定义数据源（测试用） */
export function clearNoticeProvider() {
  _provider = null;
}
