/**
 * 国际化（react-i18next）
 *
 * 对齐 NewLife.Core / NewLife.Cube 的请求语言语义：
 * - 语言清单 32 种（与 Core `Localization.SupportedCultures` 一致），英文为源文与兜底
 * - 内置 11 种全量词典；其余语言只参与识别/归一化，文案统一回退英文
 * - 启动顺序：?lang= → localStorage['cube-language'] → 浏览器语言（Accept-Language）→ 站点/租户默认 → 英文
 * - 语言代码归一化与服务端 Localization.NormalizeCulture 一致（裸语言码、旧别名、区域映射、zh-Hans/zh-Hant）
 * - 切换语言只写 localStorage 与 URL 的 lang 参数，**不写服务端 Cookie/用户参数**；请求侧由 `Accept-Language` 头传递
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

/** 已完成全量翻译、可供用户选择的语言。新增语言时先补齐 app/translation 词典，再加入此清单 */
export const fullyTranslatedLanguages = [
  'zh-CN',
  'zh-TW',
  'en-US',
  'es-ES',
  'de-DE',
  'ja-JP',
  'fr-FR',
  'pt-BR',
  'ru-RU',
  'ko-KR',
  'ar-SA',
] as const;

const supportedValues = supportedLanguages.map((item) => item.value) as readonly string[];

/** 语言存储键 */
export const LANGUAGE_STORAGE_KEY = 'cube-language';

/** 站点/租户下发的默认语言（/Cube/Site 的 language.default，晚于启动到达） */
let siteDefaultLanguage: CubeLocale | null = null;
/** 站点是否锁定语言（language.locked=true 时前端隐藏切换入口） */
let languageLocked = false;

/** 从右到左书写的语言 */
const rtlLanguages: readonly string[] = ['ar-SA', 'he-IL', 'fa-IR'];

/** 旧版语言别名，对应 NewLife.Core NormalizeCulture 的映射 */
const legacyAliases: Record<string, string> = { in: 'id', iw: 'he', no: 'nb', mo: 'ro' };

/** 语言代码归一化：精确匹配优先，其次按主语言前缀匹配，未命中回退英文 */
export function normalizeLanguage(language: string): CubeLocale {
  return tryNormalizeLanguage(language) ?? 'en-US';
}

/**
 * 尝试归一化语言代码；无法识别时返回 null（用于区分「真的不支持」与「回退英文」）
 *
 * @param language 原始语言代码
 * @returns 归一化后的受支持语言；识别不到时 null
 */
export function tryNormalizeLanguage(language: string): CubeLocale | null {
  if (!language) return null;
  if (supportedValues.includes(language)) return language as CubeLocale;

  const lower = language.trim().toLowerCase().replace(/_/g, '-');
  if (!lower) return null;
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
  return matched ? matched.value : null;
}

/** 读取 URL 中的 lang 参数（服务端 RequestLocalization 的最高优先级来源） */
function readQueryLanguage(): string | null {
  if (typeof window === 'undefined') return null;
  return new URLSearchParams(window.location.search).get('lang');
}

/** 读取本地存储中的语言 */
function readStoredLanguage(): string | null {
  try {
    return typeof localStorage !== 'undefined' ? localStorage.getItem(LANGUAGE_STORAGE_KEY) : null;
  } catch {
    return null;
  }
}

/**
 * 读取浏览器语言（等价于请求头 Accept-Language）
 *
 * 按用户偏好顺序取第一个**真实受支持**的语言；全部不支持时返回 null，交由站点默认语承接。
 *
 * @returns 受支持的浏览器语言；无匹配时 null
 */
function readBrowserLanguage(): CubeLocale | null {
  if (typeof navigator === 'undefined') return null;
  const list = navigator.languages?.length ? navigator.languages : [navigator.language];
  for (const item of list) {
    const matched = tryNormalizeLanguage(item ?? '');
    if (matched) return matched;
  }
  return null;
}

/** 读取 URL、本地存储、浏览器语言或站点默认语言 */
export function resolveLanguage(): CubeLocale {
  const query = readQueryLanguage();
  if (query) return normalizeLanguage(query);

  const stored = readStoredLanguage();
  if (stored) return normalizeLanguage(stored);

  return readBrowserLanguage() ?? siteDefaultLanguage ?? 'en-US';
}

/**
 * 应用站点/租户下发的语言设置（`/Cube/Site` 的 `language`）
 *
 * 只记录默认语言与锁定标记；未显式选过语言时按新链路重新解析并切换，
 * 使「浏览器语言不受支持 → 站点默认」在首次加载后生效。
 *
 * @param info 站点语言设置（可空）
 */
export function applySiteLanguage(info?: { default?: string | null; locked?: boolean } | null): void {
  siteDefaultLanguage = info?.default ? tryNormalizeLanguage(info.default) : null;
  languageLocked = !!info?.locked;

  if (hasExplicitLanguage()) return;
  const resolved = resolveLanguage();
  if (resolved !== getCurrentLanguage()) void i18n.changeLanguage(resolved);
}

/** 站点是否锁定语言（锁定后隐藏语言切换入口） */
export function isLanguageLocked(): boolean {
  return languageLocked;
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

/** 切换语言并持久化到本地存储与 URL（不写服务端 Cookie，请求侧由 Accept-Language 传递） */
export function setLanguage(language: CubeLocale) {
  const locale = normalizeLanguage(language);
  void i18n.changeLanguage(locale);
  try {
    localStorage.setItem(LANGUAGE_STORAGE_KEY, locale);
  } catch {
    // 隐私模式等禁用存储时忽略，本次会话仍按运行时语言生效
  }

  syncQueryLanguage(locale);
}

/** 恢复自动语言（跟随浏览器/站点默认），清除本地存储与 URL 参数 */
export function setAutoLanguage() {
  try {
    localStorage.removeItem(LANGUAGE_STORAGE_KEY);
  } catch {
    // 忽略存储不可用
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
const antdLocales: Partial<Record<CubeLocale, typeof antdZhCN>> = {
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

/** 获取当前语言对应的 antd 语言包；非全量语言回退英文，避免混合语言界面 */
export function getAntdLocale() {
  const locale = getCurrentLanguage();
  if (!(fullyTranslatedLanguages as readonly string[]).includes(locale)) return antdEnUS;

  return antdLocales[locale] ?? antdEnUS;
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
