import { afterEach, describe, expect, it } from 'vitest';
import i18n, {
  CULTURE_COOKIE_NAME,
  getCurrentLanguage,
  hasExplicitLanguage,
  isRtl,
  normalizeLanguage,
  resolveLanguage,
  setAutoLanguage,
  setLanguage,
  supportedLanguages,
  t,
} from '../index';
import appZhCN from '../app/zh-CN';
import appZhTW from '../app/zh-TW';
import appEnUS from '../app/en-US';
import appEs from '../app/es';
import appDe from '../app/de';
import appJa from '../app/ja';
import appFr from '../app/fr';
import appPt from '../app/pt';
import appRu from '../app/ru';
import appKo from '../app/ko';
import appAr from '../app/ar';

describe('i18n', () => {
  afterEach(async () => {
    localStorage.clear();
    window.history.replaceState(null, '', '/');
    document.cookie = `${CULTURE_COOKIE_NAME}=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT`;
    await i18n.changeLanguage('en-US');
    document.documentElement.removeAttribute('dir');
  });

  it('支持 32 种语言且前三固定', () => {
    expect(supportedLanguages).toHaveLength(32);
    expect(supportedLanguages.slice(0, 3).map((item) => item.value)).toEqual(['zh-CN', 'zh-TW', 'en-US']);
  });

  it('语言代码按精确、主语言前缀、英文兜底归一化', () => {
    expect(normalizeLanguage('zh-TW')).toBe('zh-TW');
    expect(normalizeLanguage('zh-HK')).toBe('zh-TW');
    expect(normalizeLanguage('zh-Hant')).toBe('zh-TW');
    expect(normalizeLanguage('zh-Hans')).toBe('zh-CN');
    expect(normalizeLanguage('fr-CA')).toBe('fr-FR');
    expect(normalizeLanguage('de-AT')).toBe('de-DE');
    expect(normalizeLanguage('pt-PT')).toBe('pt-BR');
    expect(normalizeLanguage('en-GB')).toBe('en-US');
    expect(normalizeLanguage('sw-KE')).toBe('en-US');
  });

  it('兼容服务端旧语言别名', () => {
    expect(normalizeLanguage('in')).toBe('id-ID');
    expect(normalizeLanguage('iw')).toBe('he-IL');
    expect(normalizeLanguage('no')).toBe('nb-NO');
    expect(normalizeLanguage('mo')).toBe('ro-RO');
  });

  it('URL 的 lang 参数优先于本地存储', () => {
    localStorage.setItem('cube-language', 'de-DE');
    window.history.replaceState(null, '', '/?lang=ja-JP');
    expect(resolveLanguage()).toBe('ja-JP');

    // 裸语言码同样归一化
    window.history.replaceState(null, '', '/?lang=fr');
    expect(resolveLanguage()).toBe('fr-FR');
  });

  it('从 localStorage 恢复语言', () => {
    localStorage.setItem('cube-language', 'ja-JP');
    expect(resolveLanguage()).toBe('ja-JP');
  });

  it('从服务端文化 Cookie 恢复语言', () => {
    const value = encodeURIComponent('c=ko-KR|uic=ko-KR');
    document.cookie = `${CULTURE_COOKIE_NAME}=${value}; path=/`;
    expect(resolveLanguage()).toBe('ko-KR');
  });

  it('切换语言写入存储、服务端 Cookie 并同步 URL 与 html 属性', async () => {
    window.history.replaceState(null, '', '/admin/user?lang=en-US');
    setLanguage('ja-JP');
    await i18n.changeLanguage('ja-JP');

    expect(localStorage.getItem('cube-language')).toBe('ja-JP');
    expect(getCurrentLanguage()).toBe('ja-JP');
    expect(window.location.search).toBe('?lang=ja-JP');
    expect(document.cookie).toContain(`${CULTURE_COOKIE_NAME}=${encodeURIComponent('c=ja-JP|uic=ja-JP')}`);
    expect(document.documentElement.getAttribute('lang')).toBe('ja-JP');
    expect(i18n.t('common.save')).toBe('保存');
  });

  it('阿拉伯语切换为 RTL', async () => {
    setLanguage('ar-SA');
    await i18n.changeLanguage('ar-SA');

    expect(isRtl('ar-SA')).toBe(true);
    expect(document.documentElement.getAttribute('dir')).toBe('rtl');
    expect(i18n.t('common.logout')).toBe('تسجيل الخروج');
  });

  it('希伯来语与波斯语切换为 RTL', async () => {
    expect(isRtl('he-IL')).toBe(true);
    expect(isRtl('fa-IR')).toBe(true);

    setLanguage('he-IL');
    await i18n.changeLanguage('he-IL');
    expect(document.documentElement.getAttribute('dir')).toBe('rtl');
  });

  it('缺失语言回退英文', async () => {
    await i18n.changeLanguage('sw-KE');
    expect(i18n.t('common.save')).toBe('Save');
    await i18n.changeLanguage('en-US');
  });

  it('新增语言缺失词条回退英文', async () => {
    await i18n.changeLanguage('bn-BD');

    // translation 命名空间未提供该语言，回退 en-US
    expect(i18n.t('common.save')).toBe('Save');
    // 业务词典为部分译文，已翻译词条生效，未翻译词条回退英文
    expect(t('跟随系统')).toBe('Follow system');
    expect(t('保存')).toBe('সংরক্ষণ');

    await i18n.changeLanguage('en-US');
  });

  it('自动语言清除本地存储、服务端 Cookie 与 URL 参数', () => {
    localStorage.setItem('cube-language', 'de-DE');
    document.cookie = `${CULTURE_COOKIE_NAME}=${encodeURIComponent('c=de-DE|uic=de-DE')}; path=/`;
    window.history.replaceState(null, '', '/?lang=de-DE');
    expect(hasExplicitLanguage()).toBe(true);

    setAutoLanguage();

    expect(localStorage.getItem('cube-language')).toBeNull();
    expect(document.cookie).not.toContain(CULTURE_COOKIE_NAME);
    expect(window.location.search).toBe('');
    expect(hasExplicitLanguage()).toBe(false);
  });

  it('11 个语言的应用文案键集合一致且无空值', () => {
    const dicts = { 'zh-CN': appZhCN, 'zh-TW': appZhTW, 'en-US': appEnUS, 'es-ES': appEs, 'de-DE': appDe, 'ja-JP': appJa, 'fr-FR': appFr, 'pt-BR': appPt, 'ru-RU': appRu, 'ko-KR': appKo, 'ar-SA': appAr } as Record<string, Record<string, string>>;
    const baseKeys = Object.keys(appZhCN).sort();
    expect(baseKeys.length).toBeGreaterThan(100);

    for (const [language, dict] of Object.entries(dicts)) {
      expect(Object.keys(dict).sort(), language).toEqual(baseKeys);
      for (const key of baseKeys) {
        expect(dict[key], `${language} 缺少 [${key}]`).toBeTruthy();
      }
    }
  });

  it('应用文案按当前语言翻译，缺失回退英文/中文原文', async () => {
    await i18n.changeLanguage('en-US');
    expect(t('登录')).toBe('Sign in');
    expect(t('已发送至 {{target}}', { target: 'a@b.com' })).toBe('Sent to a@b.com');
    expect(t('共 {{count}} 条', { count: 12 })).toBe('12 total');

    await i18n.changeLanguage('zh-CN');
    expect(t('登录')).toBe('登录');
    expect(t('共 {{count}} 条', { count: 12 })).toBe('共 12 条');

    // 词典里没有的键：英文词典也没有时回退中文原文
    expect(t('未翻译的临时文案')).toBe('未翻译的临时文案');
  });
});
