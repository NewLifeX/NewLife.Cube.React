/**
 * 用户卡片契约解析单测
 */
import { describe, expect, it } from 'vitest';
import {
  DEFAULT_USER_CARD,
  relationQuery,
  relationTitle,
  resolveUserCard,
} from '../userCardMeta';

describe('userCardMeta', () => {
  it('无 ui.userCard 时使用 7 个标准维度兜底', () => {
    const config = resolveUserCard(undefined);
    expect(config.relations.map((item) => item.key)).toEqual([
      'binds',
      'tokens',
      'sessions',
      'logs',
      'oauth',
      'notices',
    ]);
    expect(config.avatarField).toBe('Avatar');
  });

  it('后端部分契约覆盖 fallback，并补齐缺失维度', () => {
    const config = resolveUserCard({
      userCard: {
        titleField: 'Name',
        relations: [
          {
            key: 'TOKENS',
            title: 'Custom tokens',
            entity: 'Admin/UserTokenX',
            query: { userId: '{id}', extra: 'x' },
            columns: ['Token'],
            mask: ['Token'],
          },
        ],
      },
    });

    expect(config.titleField).toBe('Name');
    expect(config.relations).toHaveLength(DEFAULT_USER_CARD.relations.length);

    const tokens = config.relations.find((item) => item.key === 'tokens');
    expect(tokens?.entity).toBe('/Admin/UserTokenX');
    expect(tokens?.query).toEqual({ userId: '{id}', extra: 'x' });
    expect(tokens?.columns).toEqual(['Token']);
    expect(tokens?.mask).toEqual(['Token']);
    expect(config.relations.some((item) => item.key === 'binds')).toBe(true);
  });

  it('标准键使用前端词典，自定义键使用后端标题', () => {
    expect(relationTitle({ key: 'tokens', entity: '/Admin/UserToken' })).toBe('令牌');
    expect(relationTitle({ key: 'custom', title: '自定义维度', entity: '/X' })).toBe('自定义维度');
  });

  it('查询模板替换 {id}（嵌入列表的固定过滤条件）', () => {
    const relation = {
      key: 'logs',
      entity: '/Admin/Log',
      query: { userId: '{id}', channel: 'InApp' },
    };
    expect(relationQuery(relation, 7)).toEqual({ userId: '7', channel: 'InApp' });
  });
});
