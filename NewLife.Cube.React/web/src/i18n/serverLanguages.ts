/**
 * 后端语言清单（对齐 MVC 魔方的语言下拉）
 *
 * MVC 的基本设置页直接把 `CubeLocalization.GetLanguageOptions()` 绑定到下拉框；
 * 前端通过 ReactController.Languages 取得同一份清单（Core 受支持语言 + 随请求语言本地化的显示名），
 * 不再硬编码语言列表。接口不可用时回退前端内置清单。
 */
import { getConfig } from '@/configure';
import { fullyTranslatedLanguages, getCurrentLanguage, supportedLanguages } from './index';

/** 语言选项 */
export interface ServerLanguageOption {
  /** 语言键，如 zh-CN、de-DE */
  value: string;
  /** 当前界面语言下的显示名，如德语 (Deutsch) */
  label: string;
  /** 该语言的自称，如 Deutsch */
  nativeName?: string;
}

/** 语言清单响应 */
export interface ServerLanguageInfo {
  /** 当前请求实际生效的语言 */
  current?: string | null;
  /** NewLife.Setting.Language 强制语言；自动模式为 null */
  forced?: string | null;
  /** “跟随系统”选项的本地化文案 */
  autoLabel?: string;
  /** 受支持语言 */
  languages: ServerLanguageOption[];
}

/** 后端语言清单接口（ReactController.Languages） */
export const LANGUAGE_ENDPOINT = '/api/Admin/React/Languages';

/**
 * 可选语言 = 后端支持语言 ∩ 前端全量翻译语言
 *
 * - 后端清单存在时：按后端顺序与显示名取交集（后端运行时新增、前端未翻译的语言不出现）
 * - 后端清单不可用时：回退前端全量翻译语言
 * @param serverLanguages 后端返回的语言清单
 * @returns 可提供给用户选择的语言
 */
export function resolveSelectableLanguages(
  serverLanguages?: ServerLanguageOption[] | null,
): ServerLanguageOption[] {
  const supported = new Set<string>(fullyTranslatedLanguages);

  if (serverLanguages?.length) return serverLanguages.filter((item) => supported.has(item.value));

  return supportedLanguages
    .filter((item) => supported.has(item.value))
    .map((item) => ({ value: item.value, label: item.label, nativeName: item.label }));
}

/** 语言清单请求头：非全量语言回退英文，避免英文界面配意大利语语言名 */
export function getLanguageListAcceptLanguage(language = getCurrentLanguage()): string {
  return (fullyTranslatedLanguages as readonly string[]).includes(language) ? language : 'en-US';
}

/** 获取后端语言清单；失败时返回 null，由调用方回退内置清单 */
export async function fetchServerLanguages(): Promise<ServerLanguageInfo | null> {
  try {
    // 与 API 客户端使用同一基地址；默认同源
    const baseUrl = (getConfig().request.baseUrl ?? '').replace(/\/$/, '');
    const acceptLanguage = getLanguageListAcceptLanguage();
    // 服务端优先级为 ?lang= → Cookie → Accept-Language；显式带上 lang 才能覆盖旧 Cookie，
    // 保证语言下拉的显示名与当前界面语言一致（尤其是一次性 ?lang= 非全量语言时）
    const res = await fetch(`${baseUrl}${LANGUAGE_ENDPOINT}?lang=${encodeURIComponent(acceptLanguage)}`, {
      credentials: 'same-origin',
      cache: 'no-store',
      headers: { 'Accept-Language': acceptLanguage },
    });
    if (!res.ok) return null;

    const json = (await res.json()) as { data?: ServerLanguageInfo };
    return json?.data && Array.isArray(json.data.languages) ? json.data : null;
  } catch {
    return null;
  }
}
