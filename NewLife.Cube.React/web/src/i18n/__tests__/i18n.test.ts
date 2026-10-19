import { afterEach, describe, expect, it } from 'vitest';
import i18n, {
  getCurrentLanguage,
  normalizeLanguage,
  resolveLanguage,
  setLanguage,
  supportedLanguages,
} from '../index';

describe('i18n', () => {
  afterEach(async () => {
    localStorage.clear();
    await i18n.changeLanguage('en-US');
    document.documentElement.removeAttribute('dir');
  });

  it('支持 11 种语言且前三固定', () => {
    expect(supportedLanguages).toHaveLength(11);
    expect(supportedLanguages.slice(0, 3).map((item) => item.value)).toEqual(['zh-CN', 'zh-TW', 'en-US']);
  });

  it('语言代码按精确、主语言前缀、英文兜底归一化', () => {
    expect(normalizeLanguage('zh-TW')).toBe('zh-TW');
    expect(normalizeLanguage('zh-HK')).toBe('zh-TW');
    expect(normalizeLanguage('zh-Hans')).toBe('zh-CN');
    expect(normalizeLanguage('fr-CA')).toBe('fr-FR');
    expect(normalizeLanguage('de-AT')).toBe('de-DE');
    expect(normalizeLanguage('sw-KE')).toBe('en-US');
  });

  it('从 localStorage 恢复语言', () => {
    localStorage.setItem('cube-language', 'ja-JP');
    expect(resolveLanguage()).toBe('ja-JP');
  });

  it('切换语言写入存储并同步 html 属性', async () => {
    setLanguage('ja-JP');
    await i18n.changeLanguage('ja-JP');

    expect(localStorage.getItem('cube-language')).toBe('ja-JP');
    expect(getCurrentLanguage()).toBe('ja-JP');
    expect(document.documentElement.getAttribute('lang')).toBe('ja-JP');
    expect(i18n.t('common.save')).toBe('保存');
  });

  it('阿拉伯语切换为 RTL', async () => {
    setLanguage('ar-SA');
    await i18n.changeLanguage('ar-SA');

    expect(document.documentElement.getAttribute('dir')).toBe('rtl');
    expect(i18n.t('common.logout')).toBe('تسجيل الخروج');
  });

  it('缺失语言回退英文', async () => {
    await i18n.changeLanguage('sw-KE');
    expect(i18n.t('common.save')).toBe('Save');
    await i18n.changeLanguage('en-US');
  });
});
