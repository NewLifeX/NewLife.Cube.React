import { describe, expect, it } from 'vitest';
import { resolveSelectableLanguages, type ServerLanguageOption } from '../serverLanguages';

const option = (value: string, label = value): ServerLanguageOption => ({ value, label });

describe('resolveSelectableLanguages', () => {
  it('后端清单与前端全量语言取交集，保留后端顺序与显示名', () => {
    const server = [
      option('it-IT', 'Italiano'),
      option('zh-CN', 'Chinesisch (Vereinfacht)'),
      option('de-DE', 'Deutsch'),
      option('bn-BD', 'Bengalisch'),
      option('en-US', 'Englisch'),
    ];

    expect(resolveSelectableLanguages(server)).toEqual([
      option('zh-CN', 'Chinesisch (Vereinfacht)'),
      option('de-DE', 'Deutsch'),
      option('en-US', 'Englisch'),
    ]);
  });

  it('后端缺少某些前端语言时只返回后端存在的语言', () => {
    expect(resolveSelectableLanguages([option('de-DE')])).toEqual([option('de-DE')]);
  });

  it('后端清单不可用时回退 11 种全量翻译语言', () => {
    const list = resolveSelectableLanguages(null);

    expect(list).toHaveLength(11);
    expect(list[0]).toMatchObject({ value: 'zh-CN', label: '简体中文' });
    expect(list.map((item) => item.value)).not.toContain('it-IT');
  });

  it('后端清单为空时同样回退', () => {
    expect(resolveSelectableLanguages([])).toHaveLength(11);
  });
});
