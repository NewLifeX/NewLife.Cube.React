/**
 * 国际化（react-i18next）
 *
 * 对齐 NewLife.Core / NewLife.Cube 的请求语言语义：
 * - 11 种语言，英文为源文与兜底
 * - 启动顺序：?lang= → localStorage['cube-language'] → 服务端文化 Cookie → 浏览器语言 → 英文
 * - 语言代码归一化与服务端 Localization.NormalizeCulture 一致（裸语言码、旧别名、区域映射、zh-Hans/zh-Hant）
 * - 切换语言时同步 localStorage、服务端 `.AspNet.Culture` Cookie、URL 的 lang 参数、<html lang> 与 <html dir>
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
import appZhCN from './app/zh-CN';
import appZhTW from './app/zh-TW';
import appEnUS from './app/en-US';
import appEsES from './app/es';
import appDeDE from './app/de';
import appJaJP from './app/ja';
import appFrFR from './app/fr';
import appPtBR from './app/pt';
import appRuRU from './app/ru';
import appKoKR from './app/ko';
import appArSA from './app/ar';
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

/** 语言存储键与服务器文化 Cookie（与 NewLife.Cube 的 CookieRequestCultureProvider 一致） */
export const LANGUAGE_STORAGE_KEY = 'cube-language';
export const CULTURE_COOKIE_NAME = '.AspNet.Culture';

/** 从右到左书写的语言 */
const rtlLanguages: readonly string[] = ['ar-SA'];

/** 旧版语言别名，对应 NewLife.Core NormalizeCulture 的映射 */
const legacyAliases: Record<string, string> = { in: 'id', iw: 'he', no: 'nb', mo: 'ro' };

/** 语言代码归一化：精确匹配优先，其次按主语言前缀匹配，未命中回退英文 */
export function normalizeLanguage(language: string): CubeLocale {
  if (!language) return 'en-US';
  if (supportedValues.includes(language)) return language as CubeLocale;

  const lower = language.trim().toLowerCase().replace(/_/g, '-');
  if (lower.startsWith('zh')) {
    const isHant =
      lower.includes('hant') ||
      lower.endsWith('-tw') ||
      lower.endsWith('-hk') ||
      lower.endsWith('-mo');
    return isHant ? 'zh-TW' : 'zh-CN';
  }

  const rawPrefix = lower.split('-')[0];
  const prefix = legacyAliases[rawPrefix] ?? rawPrefix;
  const matched = supportedLanguages.find((item) => item.value.split('-')[0].toLowerCase() === prefix);
  return matched ? matched.value : 'en-US';
}

/** 读取 URL 中的 lang 参数（服务端 RequestLocalization 的最高优先级来源） */
function readQueryLanguage(): string | null {
  if (typeof window === 'undefined') return null;
  return new URLSearchParams(window.location.search).get('lang');
}

/** 读取服务端文化 Cookie（值为 c=zh-CN|uic=zh-CN 的 URL 编码形式） */
function readCultureCookie(): string | null {
  if (typeof document === 'undefined') return null;

  const match = document.cookie.match(/(?:^|;\s*)\.AspNet\.Culture=([^;]*)/);
  if (!match) return null;

  let value: string;
  try {
    value = decodeURIComponent(match[1]);
  } catch {
    return null;
  }

  const ui = /(?:^|\|)uic=([^|]+)/.exec(value);
  return ui ? ui[1] : null;
}

/** 读取 URL、本地存储、服务端 Cookie 或浏览器语言 */
export function resolveLanguage(): CubeLocale {
  const query = readQueryLanguage();
  if (query) return normalizeLanguage(query);

  const stored = typeof localStorage !== 'undefined' ? localStorage.getItem(LANGUAGE_STORAGE_KEY) : null;
  if (stored) return normalizeLanguage(stored);

  const cookie = readCultureCookie();
  if (cookie) return normalizeLanguage(cookie);

  const browser = typeof navigator !== 'undefined' ? navigator.language : '';
  return normalizeLanguage(browser || 'en-US');
}

/** 是否从右到左书写 */
export function isRtl(language: string): boolean {
  return rtlLanguages.includes(normalizeLanguage(language));
}

/** 同步 <html lang> 与 <html dir> */
function applyLanguageAttributes(language: string) {
  if (typeof document === 'undefined') return;

  const locale = normalizeLanguage(language);
  document.documentElement.setAttribute('lang', locale);
  document.documentElement.setAttribute('dir', isRtl(locale) ? 'rtl' : 'ltr');
}

/** 写入服务端文化 Cookie，使后续服务端响应（文件下载、新窗口页面等）跟随当前语言 */
function writeCultureCookie(language: CubeLocale) {
  if (typeof document === 'undefined') return;

  const value = encodeURIComponent(`c=${language}|uic=${language}`);
  document.cookie = `${CULTURE_COOKIE_NAME}=${value}; path=/; SameSite=Lax`;
}

/** 同步 URL 中已有的 lang 参数，避免刷新后被旧语言覆盖 */
function syncQueryLanguage(language: CubeLocale) {
  if (typeof window === 'undefined') return;

  const url = new URL(window.location.href);
  if (!url.searchParams.has('lang')) return;

  url.searchParams.set('lang', language);
  window.history.replaceState(null, '', url.pathname + url.search + url.hash);
}

const resources = {
  'zh-CN': { translation: zhCN, app: appZhCN },
  'zh-TW': { translation: zhTW, app: appZhTW },
  'en-US': { translation: enUS, app: appEnUS },
  'es-ES': { translation: esES, app: appEsES },
  'de-DE': { translation: deDE, app: appDeDE },
  'ja-JP': { translation: jaJP, app: appJaJP },
  'fr-FR': { translation: frFR, app: appFrFR },
  'pt-BR': { translation: ptBR, app: appPtBR },
  'ru-RU': { translation: ruRU, app: appRuRU },
  'ko-KR': { translation: koKR, app: appKoKR },
  'ar-SA': { translation: arSA, app: appArSA },
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

/** 切换语言并持久化到本地存储、服务端 Cookie 与 URL */
export function setLanguage(language: CubeLocale) {
  const locale = normalizeLanguage(language);
  void i18n.changeLanguage(locale);
  if (typeof localStorage !== 'undefined') localStorage.setItem(LANGUAGE_STORAGE_KEY, locale);

  writeCultureCookie(locale);
  syncQueryLanguage(locale);
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

/**
 * 业务界面文案翻译：以中文原文为键，缺失译文时回退中文（defaultValue）。
 * 组件内直接调用即可；App 已订阅语言变化，切换语言后整棵树重新渲染。
 */
export function t(key: string, vars?: Record<string, unknown>): string {
  return i18n.t(key, { ns: 'app', defaultValue: key, ...vars }) as string;
}

export default i18n;
