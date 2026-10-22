/**
 * 国际化（react-i18next）
 *
 * 对齐 NewLife.Core / NewLife.Cube 的请求语言语义：
 * - 32 种语言（与 Core `Localization.SupportedCultures` 一致），英文为源文与兜底
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
import appBnBD from './app/bn';
import appCsCZ from './app/cs';
import appDaDK from './app/da';
import appElGR from './app/el';
import appFaIR from './app/fa';
import appFiFI from './app/fi';
import appHeIL from './app/he';
import appHiIN from './app/hi';
import appHuHU from './app/hu';
import appIdID from './app/id';
import appItIT from './app/it';
import appMsMY from './app/ms';
import appNbNO from './app/nb';
import appNlNL from './app/nl';
import appPlPL from './app/pl';
import appRoRO from './app/ro';
import appSvSE from './app/sv';
import appThTH from './app/th';
import appTrTR from './app/tr';
import appUkUA from './app/uk';
import appViVN from './app/vi';
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
import antdBnBD from 'antd/locale/bn_BD';
import antdCsCZ from 'antd/locale/cs_CZ';
import antdDaDK from 'antd/locale/da_DK';
import antdElGR from 'antd/locale/el_GR';
import antdFaIR from 'antd/locale/fa_IR';
import antdFiFI from 'antd/locale/fi_FI';
import antdHeIL from 'antd/locale/he_IL';
import antdHiIN from 'antd/locale/hi_IN';
import antdHuHU from 'antd/locale/hu_HU';
import antdIdID from 'antd/locale/id_ID';
import antdItIT from 'antd/locale/it_IT';
import antdMsMY from 'antd/locale/ms_MY';
import antdNbNO from 'antd/locale/nb_NO';
import antdNlNL from 'antd/locale/nl_NL';
import antdPlPL from 'antd/locale/pl_PL';
import antdRoRO from 'antd/locale/ro_RO';
import antdSvSE from 'antd/locale/sv_SE';
import antdThTH from 'antd/locale/th_TH';
import antdTrTR from 'antd/locale/tr_TR';
import antdUkUA from 'antd/locale/uk_UA';
import antdViVN from 'antd/locale/vi_VN';

/** 支持的语言。前三位固定为简体中文、繁體中文、英文，其余与 NewLife.Core 语言清单一致 */
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
  { label: 'বাংলা', value: 'bn-BD' },
  { label: 'Čeština', value: 'cs-CZ' },
  { label: 'Dansk', value: 'da-DK' },
  { label: 'Ελληνικά', value: 'el-GR' },
  { label: 'فارسی', value: 'fa-IR' },
  { label: 'Suomi', value: 'fi-FI' },
  { label: 'עברית', value: 'he-IL' },
  { label: 'हिन्दी', value: 'hi-IN' },
  { label: 'Magyar', value: 'hu-HU' },
  { label: 'Bahasa Indonesia', value: 'id-ID' },
  { label: 'Italiano', value: 'it-IT' },
  { label: 'Bahasa Melayu', value: 'ms-MY' },
  { label: 'Norsk bokmål', value: 'nb-NO' },
  { label: 'Nederlands', value: 'nl-NL' },
  { label: 'Polski', value: 'pl-PL' },
  { label: 'Română', value: 'ro-RO' },
  { label: 'Svenska', value: 'sv-SE' },
  { label: 'ไทย', value: 'th-TH' },
  { label: 'Türkçe', value: 'tr-TR' },
  { label: 'Українська', value: 'uk-UA' },
  { label: 'Tiếng Việt', value: 'vi-VN' },
] as const;

export type CubeLocale = (typeof supportedLanguages)[number]['value'];

const supportedValues = supportedLanguages.map((item) => item.value) as readonly string[];

/** 语言存储键与服务器文化 Cookie（与 NewLife.Cube 的 CookieRequestCultureProvider 一致） */
export const LANGUAGE_STORAGE_KEY = 'cube-language';
export const CULTURE_COOKIE_NAME = '.AspNet.Culture';

/** 从右到左书写的语言 */
const rtlLanguages: readonly string[] = ['ar-SA', 'he-IL', 'fa-IR'];

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

/** 读取本地存储中的语言 */
function readStoredLanguage(): string | null {
  try {
    return typeof localStorage !== 'undefined' ? localStorage.getItem(LANGUAGE_STORAGE_KEY) : null;
  } catch {
    return null;
  }
}

/** 读取 URL、本地存储、服务端 Cookie 或浏览器语言 */
export function resolveLanguage(): CubeLocale {
  const query = readQueryLanguage();
  if (query) return normalizeLanguage(query);

  const stored = readStoredLanguage();
  if (stored) return normalizeLanguage(stored);

  const cookie = readCultureCookie();
  if (cookie) return normalizeLanguage(cookie);

  const browser = typeof navigator !== 'undefined' ? navigator.language : '';
  return normalizeLanguage(browser || 'en-US');
}

/** 是否已显式选择语言（URL 参数或本地存储） */
export function hasExplicitLanguage(): boolean {
  if (typeof window === 'undefined') return false;
  if (new URLSearchParams(window.location.search).get('lang')) return true;

  return !!readStoredLanguage();
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
  // 以下语言暂只提供已有译文，缺失词条回退英文（translation 命名空间同样回退 en-US）
  'bn-BD': { app: appBnBD },
  'cs-CZ': { app: appCsCZ },
  'da-DK': { app: appDaDK },
  'el-GR': { app: appElGR },
  'fa-IR': { app: appFaIR },
  'fi-FI': { app: appFiFI },
  'he-IL': { app: appHeIL },
  'hi-IN': { app: appHiIN },
  'hu-HU': { app: appHuHU },
  'id-ID': { app: appIdID },
  'it-IT': { app: appItIT },
  'ms-MY': { app: appMsMY },
  'nb-NO': { app: appNbNO },
  'nl-NL': { app: appNlNL },
  'pl-PL': { app: appPlPL },
  'ro-RO': { app: appRoRO },
  'sv-SE': { app: appSvSE },
  'th-TH': { app: appThTH },
  'tr-TR': { app: appTrTR },
  'uk-UA': { app: appUkUA },
  'vi-VN': { app: appViVN },
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
  try {
    localStorage.setItem(LANGUAGE_STORAGE_KEY, locale);
  } catch {
    // 隐私模式等禁用存储时忽略，Cookie 仍然生效
  }

  writeCultureCookie(locale);
  syncQueryLanguage(locale);
}

/** 恢复自动语言（跟随浏览器/系统），清除本地存储、服务端 Cookie 与 URL 参数 */
export function setAutoLanguage() {
  try {
    localStorage.removeItem(LANGUAGE_STORAGE_KEY);
  } catch {
    // 忽略存储不可用
  }

  if (typeof document !== 'undefined') {
    document.cookie = `${CULTURE_COOKIE_NAME}=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT`;
  }

  if (typeof window !== 'undefined') {
    const url = new URL(window.location.href);
    if (url.searchParams.has('lang')) {
      url.searchParams.delete('lang');
      window.history.replaceState(null, '', url.pathname + url.search + url.hash);
    }
  }
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
  'bn-BD': antdBnBD,
  'cs-CZ': antdCsCZ,
  'da-DK': antdDaDK,
  'el-GR': antdElGR,
  'fa-IR': antdFaIR,
  'fi-FI': antdFiFI,
  'he-IL': antdHeIL,
  'hi-IN': antdHiIN,
  'hu-HU': antdHuHU,
  'id-ID': antdIdID,
  'it-IT': antdItIT,
  'ms-MY': antdMsMY,
  'nb-NO': antdNbNO,
  'nl-NL': antdNlNL,
  'pl-PL': antdPlPL,
  'ro-RO': antdRoRO,
  'sv-SE': antdSvSE,
  'th-TH': antdThTH,
  'tr-TR': antdTrTR,
  'uk-UA': antdUkUA,
  'vi-VN': antdViVN,
};

/** 获取当前语言对应的 antd 语言包 */
export function getAntdLocale() {
  return antdLocales[getCurrentLanguage()] ?? antdEnUS;
}

/**
 * 业务界面文案翻译：以中文原文为键，缺失译文时回退英文（与后端缺失译文回退英文源文一致）。
 * 组件内直接调用即可；App 已订阅语言变化，切换语言后整棵树重新渲染。
 */
export function t(key: string, vars?: Record<string, unknown>): string {
  const english = (appEnUS as Record<string, string>)[key];
  return i18n.t(key, { ns: 'app', defaultValue: english ?? key, ...vars }) as string;
}

export default i18n;
