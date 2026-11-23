/**
 * 用户卡片契约（meta.ui.userCard）解析
 *
 * 后端 UserController 通过 OnGetPageUi 下发关联维度描述；旧版 Cube 包没有该契约时，
 * 使用本文件的内置 fallback，保证皮肤升级与后端升级可以分步进行。
 */
import { t } from '@/i18n';

/** 用户卡片关联维度 */
export interface UserCardRelation {
  /** 稳定键：binds/tokens/sessions/logs/oauth/notices（自定义关系可用其他键） */
  key: string;
  /** 后端本地化标题；标准键优先使用前端词典 */
  title?: string;
  /** 图标语义名：link/key/laptop/file-text/history/bell */
  icon?: string;
  /** 实体 API 路径（统一归一为带前导 /） */
  entity: string;
  /** 查询参数模板，支持 {id} 占位符 */
  query?: Record<string, string>;
  /** 排序字段 */
  sort?: string;
  /** 是否降序 */
  desc?: boolean;
  /** 展示列（实体 /meta 的 list 字段名）。紧凑卡片型皮肤使用；列表嵌入型皮肤忽略 */
  columns?: string[];
  /** 脱敏字段名。紧凑卡片型皮肤使用；列表嵌入型皮肤直接复用实体列表，不额外脱敏 */
  mask?: string[];
}

/** 用户卡片配置 */
export interface UserCardConfig {
  /** 头像字段（详情接口字段名） */
  avatarField?: string;
  /** 主标题字段 */
  titleField?: string;
  /** 副标题字段 */
  subtitleField?: string;
  /** 关联维度 */
  relations: UserCardRelation[];
}

/** 标准键 → 前端文案键（标准键统一走 11 语言词典，保证多语言一致） */
const KNOWN_TITLE_KEYS: Record<string, string> = {
  binds: '第三方授权',
  tokens: '令牌',
  sessions: '在线会话',
  logs: '操作日志',
  oauth: 'OAuth 日志',
  notices: '通知记录',
  tenants: '租户成员',
};

/** 内置关联维度（旧版后端兜底） */
const FALLBACK_RELATIONS: UserCardRelation[] = [
  {
    key: 'binds',
    icon: 'link',
    entity: '/Admin/UserConnect',
    query: { userId: '{id}' },
    sort: 'Id',
    desc: true,
    columns: ['Provider', 'NickName', 'OpenId', 'UnionId', 'Enable', 'UpdateTime'],
    mask: ['OpenId', 'UnionId'],
  },
  {
    key: 'tokens',
    icon: 'key',
    entity: '/Admin/UserToken',
    query: { userId: '{id}' },
    sort: 'Id',
    desc: true,
    columns: ['Token', 'Url', 'Expire', 'Enable', 'LastTime', 'LastIP'],
    mask: ['Token'],
  },
  {
    key: 'sessions',
    icon: 'laptop',
    entity: '/Admin/UserOnline',
    query: { userId: '{id}' },
    sort: 'UpdateTime',
    desc: true,
    columns: ['Platform', 'OS', 'Brower', 'Device', 'Address', 'OnlineTime', 'UpdateTime'],
  },
  {
    key: 'logs',
    icon: 'file-text',
    entity: '/Admin/Log',
    query: { userId: '{id}' },
    sort: 'Id',
    desc: true,
    columns: ['Category', 'Action', 'Remark', 'CreateTime'],
  },
  {
    key: 'oauth',
    icon: 'history',
    entity: '/Admin/OAuthLog',
    query: { userId: '{id}' },
    sort: 'Id',
    desc: true,
    columns: ['Provider', 'Action', 'Success', 'CreateTime'],
  },
  {
    key: 'notices',
    icon: 'bell',
    entity: '/Admin/NotificationRecord',
    query: { userId: '{id}', channel: 'InApp' },
    sort: 'Id',
    desc: true,
    columns: ['Channel', 'Title', 'Success', 'Read', 'CreateTime'],
  },
];

/** 内置用户卡片配置 */
export const DEFAULT_USER_CARD: UserCardConfig = {
  avatarField: 'Avatar',
  titleField: 'DisplayName',
  subtitleField: 'Name',
  relations: FALLBACK_RELATIONS,
};

/** 归一实体路径：去空白、补前导 / */
function normalizeEntity(entity: string): string {
  const text = entity.trim().replace(/^\/+/, '');
  return text ? `/${text}` : '';
}

/** 归一字符串数组 */
function normalizeList(value: unknown): string[] | undefined {
  if (!Array.isArray(value)) return undefined;
  const list = value.map((item) => String(item ?? '').trim()).filter(Boolean);
  return list.length ? list : undefined;
}

/** 归一查询参数模板 */
function normalizeQuery(value: unknown): Record<string, string> | undefined {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return undefined;
  const entries = Object.entries(value as Record<string, unknown>)
    .map(([key, val]) => [key, String(val ?? '')] as const)
    .filter(([key]) => !!key);
  return entries.length ? Object.fromEntries(entries) : undefined;
}

/**
 * 解析 meta.ui.userCard
 *
 * @param ui 页面元数据中的 ui 扩展
 * @returns 归一后的用户卡片配置；无契约时返回内置配置
 */
export function resolveUserCard(ui?: Record<string, unknown> | null): UserCardConfig {
  const raw = ui?.userCard;
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return DEFAULT_USER_CARD;

  const source = raw as Partial<UserCardConfig>;
  const relations: UserCardRelation[] = [];
  const fallbackByKey = new Map(DEFAULT_USER_CARD.relations.map((item) => [item.key, item]));
  const seen = new Set<string>();

  if (Array.isArray(source.relations)) {
    for (const item of source.relations) {
      if (!item || typeof item !== 'object') continue;
      const rel = item as Partial<UserCardRelation>;
      const key = String(rel.key ?? '').trim().toLowerCase();
      const entity = normalizeEntity(String(rel.entity ?? ''));
      if (!key || !entity || seen.has(key)) continue;

      const base = fallbackByKey.get(key);
      relations.push({
        key,
        title: rel.title ? String(rel.title) : base?.title,
        icon: rel.icon ? String(rel.icon) : base?.icon,
        entity,
        query: { ...(base?.query ?? {}), ...(normalizeQuery(rel.query) ?? {}) },
        sort: rel.sort ? String(rel.sort) : base?.sort,
        desc: typeof rel.desc === 'boolean' ? rel.desc : base?.desc,
        columns: normalizeList(rel.columns) ?? base?.columns,
        mask: normalizeList(rel.mask) ?? base?.mask,
      });
      seen.add(key);
    }
  }

  // 后端只下发部分关系时补齐内置维度，避免升级过程中功能消失
  for (const item of DEFAULT_USER_CARD.relations) {
    if (!seen.has(item.key)) relations.push(item);
  }

  return {
    avatarField: source.avatarField ? String(source.avatarField) : DEFAULT_USER_CARD.avatarField,
    titleField: source.titleField ? String(source.titleField) : DEFAULT_USER_CARD.titleField,
    subtitleField: source.subtitleField ? String(source.subtitleField) : DEFAULT_USER_CARD.subtitleField,
    relations: relations.length ? relations : DEFAULT_USER_CARD.relations,
  };
}

/**
 * 关联维度标题
 *
 * 标准键优先使用前端词典（11 种语言一致）；自定义键使用后端标题。
 *
 * @param relation 关联维度
 * @returns 本地化标题
 */
export function relationTitle(relation: UserCardRelation): string {
  const key = KNOWN_TITLE_KEYS[relation.key];
  if (key) return t(key);
  return relation.title || relation.key;
}

/**
 * 替换查询模板中的 {id}
 *
 * @param relation 关联维度
 * @param id 用户主键
 * @returns 查询参数
 */
export function relationQuery(relation: UserCardRelation, id: string | number): Record<string, string> {
  const result: Record<string, string> = {};
  for (const [key, value] of Object.entries(relation.query ?? {})) {
    result[key] = String(value).replace(/\{id\}/g, String(id));
  }
  return result;
}

export default {
  DEFAULT_USER_CARD,
  resolveUserCard,
  relationTitle,
  relationQuery,
};
