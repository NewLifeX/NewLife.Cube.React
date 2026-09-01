/**
 * URL 与取值工具（对齐 Vue 皮肤 core/utils/url.ts）
 */

/** 字符串转 PascalCase */
export function toPascalCase(str: string): string {
  if (!str) return '';
  return str
    .split(/[-_/\s]+/)
    .filter(Boolean)
    .map((s) => s.charAt(0).toUpperCase() + s.slice(1))
    .join('');
}

/** 字符串转小驼峰 */
export function toCamelCase(str: string): string {
  if (!str) return '';
  const s = str.replace(/[-_](\w)/g, (_, c: string) => (c ? c.toUpperCase() : ''));
  return s.charAt(0).toLowerCase() + s.slice(1);
}

/** 翻转首字母大小写（PascalCase ↔ camelCase） */
export function toPascalAndCamel(str: string): string {
  if (!str) return '';
  const first = str.charAt(0);
  return (first === first.toUpperCase() ? first.toLowerCase() : first.toUpperCase()) + str.slice(1);
}

/**
 * 路由路径 → API 前缀（带前导斜杠，api-core resolveRequestUrl 依赖）
 *
 * 示例：/device/device-profile → /Device/DeviceProfile
 * （实体接口由 api-core 自动补 /api 前缀）
 */
export function routeToApiPrefix(path: string): string {
  const parts = path.split('/').filter(Boolean).map(toPascalCase);
  return parts.length ? `/${parts.join('/')}` : '/';
}

/**
 * 从数据对象中取值，大小写不敏感。
 *
 * 后端实体 JSON 为 camelCase（name/displayName），字段元数据为 PascalCase（Name/DisplayName），
 * 且注入的扩展字段（IExtend.Items）保持原键大小写（如 AvatarImage），
 * 故统一按小写比对，避免 GetPage / 数据接口字段名大小写不一致导致取不到值。
 * 后端约定同一表不会出现仅大小写不同的字段，此匹配安全。
 */
export function getValueByKey(data: Record<string, unknown>, key: string): unknown {
  if (key in data) return data[key];
  const lowerKey = key.toLowerCase();
  // 行数据为普通 JSON 对象，for...in 仅遍历自身可枚举键
  for (const k in data) {
    if (k.toLowerCase() === lowerKey) return data[k];
  }
  return undefined;
}

/**
 * 按大小写不敏感键名写入数据对象。已存在同键（忽略大小写）则覆盖原键，否则新增。
 *
 * @param data 目标对象
 * @param key 键名（可任意大小写）
 * @param value 值
 */
export function setValueByKey(data: Record<string, unknown>, key: string, value: unknown): void {
  if (key in data) {
    data[key] = value;
    return;
  }
  const lowerKey = key.toLowerCase();
  for (const k in data) {
    if (k.toLowerCase() === lowerKey) {
      data[k] = value;
      return;
    }
  }
  data[key] = value;
}

/**
 * URL 变量替换：将 `/path/{Id}` 替换为 `/path/123`
 *
 * @param url 含变量占位符的 URL 模板
 * @param row 数据行对象
 */
export function resolveUrl(url: string, row: Record<string, unknown>): string {
  return url.replace(/\{(\w+)\}/g, (_, key: string) => {
    const val = getValueByKey(row, key);
    return val !== undefined && val !== null ? encodeURIComponent(String(val)) : '';
  });
}

/**
 * 解析 URL 查询串为搜索参数对象（外部跳转携带查询条件，如工作台指标卡跳转日志页）
 *
 * 支持：
 * - `dtStart`/`dtEnd` → 时间范围（后端老参数，React 搜索区用 `CreateTime` 数组）
 * - 其余键值直接透传（`success=false`、`category=xxx` 等，后端按参数名解析）
 *
 * @param search URL 查询串（含 ? 或不含均可），如 `?dtStart=...&dtEnd=...&success=false`
 * @returns 搜索参数对象；无查询参数时返回空对象
 * @example
 * parseUrlQuery('?dtStart=2026-08-01&dtEnd=2026-08-31&success=false')
 * // => { dtStart: '2026-08-01', dtEnd: '2026-08-31', success: 'false' }
 */
export function parseUrlQuery(search: string): Record<string, unknown> {
  const q = search.startsWith('?') ? search.slice(1) : search;
  if (!q) return {};

  const rs: Record<string, unknown> = {};
  for (const [k, v] of new URLSearchParams(q).entries()) {
    // 空值忽略，避免空参数干扰查询
    if (v === '') continue;
    rs[k] = v;
  }
  return rs;
}

export default { toPascalCase, toCamelCase, routeToApiPrefix, getValueByKey, setValueByKey, resolveUrl, parseUrlQuery };
