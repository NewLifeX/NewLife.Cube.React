/**
 * 后端语言清单（对齐 MVC 魔方的语言下拉）
 *
 * MVC 的基本设置页直接把 `CubeLocalization.GetLanguageOptions()` 绑定到下拉框；
 * 前端通过 ReactController.Languages 取得同一份清单（Core 受支持语言 + 随请求语言本地化的显示名），
 * 不再硬编码语言列表。接口不可用时回退前端内置清单。
 */
import { getConfig } from '@/configure';
import { getCurrentLanguage } from './index';

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

/** 获取后端语言清单；失败时返回 null，由调用方回退内置清单 */
export async function fetchServerLanguages(): Promise<ServerLanguageInfo | null> {
  try {
    // 与 API 客户端使用同一基地址；默认同源
    const baseUrl = (getConfig().request.baseUrl ?? '').replace(/\/$/, '');
    const res = await fetch(`${baseUrl}${LANGUAGE_ENDPOINT}`, {
      credentials: 'same-origin',
      headers: { 'Accept-Language': getCurrentLanguage() },
    });
    if (!res.ok) return null;

    const json = (await res.json()) as { data?: ServerLanguageInfo };
    return json?.data && Array.isArray(json.data.languages) ? json.data : null;
  } catch {
    return null;
  }
}
