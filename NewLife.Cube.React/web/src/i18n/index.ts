/**
 * 国际化（react-i18next）
 *
 * - 11 种语言，英文为源文与兜底
 * - 启动顺序：localStorage['cube-language'] → 浏览器语言 → 英文
 * - 切换语言时同步 localStorage、<html lang> 与 <html dir>（阿拉伯语 RTL）
 */
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import zhCN from './zh-CN';
import zhTW from './zh-TW';
import enUS from './en-US';
import esES from './es';
import deDE from './de';
import jaJP from './ja';
import frFR from './fr';
import ptBR from './pt';
import ruRU from './ru';
import koKR from './ko';
import arSA from './ar';
import antdZhCN from 'antd/locale/zh_CN';
import antdZhTW from 'antd/locale/zh_TW';
import antdEnUS from 'antd/locale/en_US';
import antdEsES from 'antd/locale/es_ES';
import antdDeDE from 'antd/locale/de_DE';
import antdJaJP from 'antd/locale/ja_JP';
import antdFrFR from 'antd/locale/fr_FR';
import antdPtBR from 'antd/locale/pt_BR';
import antdRuRU from 'antd/locale/ru_RU';
import antdKoKR from 'antd/locale/ko_KR';
import antdArSA from 'antd/locale/ar_EG';

/** 支持的语言。前三位固定为简体中文、繁體中文、英文，其余与 Vue 皮肤一致 */
export const supportedLanguages = [
  { label: '简体中文', value: 'zh-CN' },
  { label: '繁體中文', value: 'zh-TW' },
  { label: 'English', value: 'en-US' },
  { label: 'Español', value: 'es-ES' },
  { label: 'Deutsch', value: 'de-DE' },
  { label: '日本語', value: 'ja-JP' },
  { label: 'Français', value: 'fr-FR' },
  { label: 'Português', value: 'pt-BR' },
  { label: 'Русский', value: 'ru-RU' },
  { label: '한국어', value: 'ko-KR' },
  { label: 'العربية', value: 'ar-SA' },
] as const;

export type CubeLocale = (typeof supportedLanguages)[number]['value'];

const supportedValues = supportedLanguages.map((item) => item.value) as readonly string[];

/** 语言代码归一化：精确匹配优先，其次按主语言前缀匹配，未命中回退英文 */
export function normalizeLanguage(language: string): CubeLocale {
  if (supportedValues.includes(language)) return language as CubeLocale;

  const lower = language.toLowerCase();
  if (lower.startsWith('zh')) {
    const isHant =
      lower.includes('hant') || lower.endsWith('-tw') || lower.endsWith('-hk') || lower.endsWith('-mo');
    return isHant ? 'zh-TW' : 'zh-CN';
  }

  const prefix = lower.split('-')[0];
  const matched = supportedLanguages.find((item) => item.value.split('-')[0].toLowerCase() === prefix);
  return matched ? matched.value : 'en-US';
}

/** 读取本地存储或浏览器语言 */
export function resolveLanguage(): CubeLocale {
  const stored = typeof localStorage !== 'undefined' ? localStorage.getItem('cube-language') : null;
  if (stored) return normalizeLanguage(stored);

  const browser = typeof navigator !== 'undefined' ? navigator.language : '';
  return normalizeLanguage(browser || 'en-US');
}

/** 同步 <html lang> 与 <html dir> */
function applyLanguageAttributes(language: string) {
  if (typeof document === 'undefined') return;

  const locale = normalizeLanguage(language);
  document.documentElement.setAttribute('lang', locale);
  document.documentElement.setAttribute('dir', locale === 'ar-SA' ? 'rtl' : 'ltr');
}

const resources = {
  'zh-CN': { translation: zhCN },
  'zh-TW': { translation: zhTW },
  'en-US': { translation: enUS },
  'es-ES': { translation: esES },
  'de-DE': { translation: deDE },
  'ja-JP': { translation: jaJP },
  'fr-FR': { translation: frFR },
  'pt-BR': { translation: ptBR },
  'ru-RU': { translation: ruRU },
  'ko-KR': { translation: koKR },
  'ar-SA': { translation: arSA },
};

const initialLanguage = resolveLanguage();

void i18n.use(initReactI18next).init({
  resources,
  lng: initialLanguage,
  fallbackLng: 'en-US',
  interpolation: { escapeValue: false },
});

i18n.on('languageChanged', applyLanguageAttributes);
applyLanguageAttributes(initialLanguage);

/** 切换语言并持久化 */
export function setLanguage(language: CubeLocale) {
  void i18n.changeLanguage(language);
  if (typeof localStorage !== 'undefined') localStorage.setItem('cube-language', language);
}

/** 获取当前语言 */
export function getCurrentLanguage(): CubeLocale {
  return normalizeLanguage(i18n.language);
}

/** antd 组件语言包 */
const antdLocales: Record<CubeLocale, typeof antdZhCN> = {
  'zh-CN': antdZhCN,
  'zh-TW': antdZhTW,
  'en-US': antdEnUS,
  'es-ES': antdEsES,
  'de-DE': antdDeDE,
  'ja-JP': antdJaJP,
  'fr-FR': antdFrFR,
  'pt-BR': antdPtBR,
  'ru-RU': antdRuRU,
  'ko-KR': antdKoKR,
  'ar-SA': antdArSA,
};

/** 获取当前语言对应的 antd 语言包 */
export function getAntdLocale() {
  return antdLocales[getCurrentLanguage()] ?? antdEnUS;
}

export default i18n;
