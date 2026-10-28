/**
 * 列偏好（浏览器本地存储）
 *
 * 呈现架构 §4.1 规则3：`/meta` 的 `list` 就是全部可用列，`visible:false` 仅表示默认不显示；
 * 用户在表格设置里的勾选与排序保存在浏览器，**用户偏好覆盖 `visible=false`**。
 * 新字段（未参与过配置）沿用 `/meta` 的 `visible` 默认值，避免升级后列凭空消失。
 */
import type { FieldMapping } from '@newlifex/cube';

/** 列偏好：列序与隐藏列（字段名，大小写不敏感） */
export interface ColumnPrefs {
  /** 列序；未列出的字段按元数据原序排在后面 */
  order: string[];
  /** 隐藏列 */
  hidden: string[];
}

const PREFIX = 'cube-columns:';

/**
 * 列偏好存储键：按页面路径分桶
 *
 * @param type 实体路径前缀（如 `/Admin/User`）
 * @returns localStorage 键名
 */
export function columnPrefsKey(type: string): string {
  return `${PREFIX}${(type || '/').toLowerCase()}`;
}

/** 取存储介质；隐私模式/被禁用时返回 null */
function storage(): Storage | null {
  try {
    return globalThis.localStorage ?? null;
  } catch {
    return null;
  }
}

/**
 * 读取列偏好
 *
 * @param type 实体路径前缀
 * @returns 偏好；未配置或解析失败返回 null
 */
export function loadColumnPrefs(type: string): ColumnPrefs | null {
  const store = storage();
  if (!store) return null;
  try {
    const raw = store.getItem(columnPrefsKey(type));
    if (!raw) return null;
    const obj = JSON.parse(raw) as Partial<ColumnPrefs>;
    return {
      order: Array.isArray(obj.order) ? obj.order.map(String) : [],
      hidden: Array.isArray(obj.hidden) ? obj.hidden.map(String) : [],
    };
  } catch {
    return null;
  }
}

/**
 * 保存列偏好
 *
 * @param type 实体路径前缀
 * @param prefs 列序与隐藏列
 */
export function saveColumnPrefs(type: string, prefs: ColumnPrefs): void {
  const store = storage();
  if (!store) return;
  try {
    store.setItem(columnPrefsKey(type), JSON.stringify({ order: prefs.order ?? [], hidden: prefs.hidden ?? [] }));
  } catch {
    /* 配额不足/隐私模式：仅本次生效，不打断页面 */
  }
}

/**
 * 清除列偏好（恢复默认）
 *
 * @param type 实体路径前缀
 */
export function clearColumnPrefs(type: string): void {
  const store = storage();
  if (!store) return;
  try {
    store.removeItem(columnPrefsKey(type));
  } catch {
    /* 忽略 */
  }
}

/** 克隆字段并覆盖可见性（保持 FieldMapping 其它属性不变） */
function withVisible(field: FieldMapping, visible: boolean): FieldMapping {
  if (field.field.visible === visible) return field;
  return { ...field, field: { ...field.field, visible } };
}

/**
 * 应用列偏好：按用户列序重排，并覆盖显隐。
 *
 * - 用户隐藏的列 → `visible=false`；
 * - 用户保留（在 order 中）的列 → `visible=true`，即浏览器偏好覆盖 `/meta` 的 `visible=false`；
 * - 未参与过配置的新字段 → 沿用 `/meta` 的 `visible`。
 *
 * @param fields `/meta.list` 全量字段
 * @param prefs 列偏好；为空时原样返回
 * @returns 应用偏好后的字段数组（新对象，不修改入参）
 */
export function applyColumnPrefs(fields: FieldMapping[], prefs: ColumnPrefs | null): FieldMapping[] {
  if (!prefs) return fields;

  const lower = (s: string) => s.toLowerCase();
  const hidden = new Set(prefs.hidden.map(lower));
  const order = prefs.order.map(lower);
  const known = new Set(order);
  const byName = new Map(fields.map((f) => [lower(f.field.name), f]));
  const ordered: FieldMapping[] = [];

  for (const name of order) {
    const field = byName.get(name);
    if (field) {
      ordered.push(field);
      byName.delete(name);
    }
  }
  for (const field of fields) {
    if (byName.has(lower(field.field.name))) ordered.push(field);
  }

  return ordered.map((field) => {
    const name = lower(field.field.name);
    if (hidden.has(name)) return withVisible(field, false);
    if (known.has(name)) return withVisible(field, true);
    return field;
  });
}
