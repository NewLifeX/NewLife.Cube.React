/**
 * 树形列表工具（LIST-17）
 *
 * 魔方树形实体（菜单/部门/地区）后端返回**扁平**行集（`EntityTreeController.Search`
 * 取 `Root.AllChilds`），父字段是自引用外键。前端按父字段重建树，交给 antd Table 的
 * `children` 机制渲染缩进与展开/收起。
 */
import type { FieldMapping } from '@newlifex/cube';
import { getValueByKey } from '@/utils/url';

/** 归一化键值：null/undefined 视为空串，其余转字符串（后端可能下数字或字符串） */
function normalizeKey(value: unknown): string {
  return value === null || value === undefined ? '' : String(value);
}

/**
 * 扁平行集 → 树形行集（不修改入参，返回浅拷贝节点）
 *
 * 父键为空、`0`、`-1` 或找不到对应父行的节点视为根节点；
 * 出现环（A 父 B、B 父 A）导致无根时回退为原始扁平数据，避免整表消失。
 *
 * @param rows 后端返回的扁平行集
 * @param keyField 主键字段名（节点自身键）
 * @param parentField 父字段名（自引用外键）
 * @returns 树形行集（每个节点可能带 children）
 */
export function buildTreeRows(
  rows: Record<string, unknown>[],
  keyField: string,
  parentField: string,
): Record<string, unknown>[] {
  if (!rows.length) return [];

  const nodes = new Map<string, Record<string, unknown>>();
  for (const row of rows) {
    const key = normalizeKey(getValueByKey(row, keyField));
    // 同键重复（分页拼接等）保留首个，避免互相覆盖
    if (!nodes.has(key)) nodes.set(key, { ...row });
  }

  const roots: Record<string, unknown>[] = [];
  for (const node of nodes.values()) {
    const parentKey = normalizeKey(getValueByKey(node, parentField));
    // 0 / -1 是魔方约定的「无父」标记（Pager 与树表父下拉一致）
    const isRootKey = !parentKey || parentKey === '0' || parentKey === '-1';
    const parent = isRootKey ? undefined : nodes.get(parentKey);
    if (parent && parent !== node) {
      const children = ((parent as { children?: Record<string, unknown>[] }).children ??= []);
      children.push(node);
    } else {
      roots.push(node);
    }
  }

  // 环或无根（父链无法回溯到根）时回退扁平，保证数据可见
  return roots.length ? roots : rows;
}

/** 视为树形父字段的候选名（大小写不敏感） */
const TREE_PARENT_NAMES = ['parentid', 'parent', 'parentkey', 'pid'];

/**
 * 自动识别树形父字段
 *
 * 命中条件：列表字段中存在与主键不同名的父字段候选，且该字段是数值/字符串类型
 * （`parentField` 显式声明为级联下拉的字段不算，避免组织范围等业务字段误判）。
 *
 * @param fields 列表字段（含元数据）
 * @param keyField 主键字段名
 * @returns 父字段名；非树形实体返回 undefined
 */
export function detectTreeField(fields: FieldMapping[], keyField: string): string | undefined {
  const key = keyField.toLowerCase();
  for (const name of TREE_PARENT_NAMES) {
    const hit = fields.find((f) => f.field.name.toLowerCase() === name);
    if (!hit) continue;
    const meta = hit.field;
    if (meta.parentField) continue;
    if (hit.field.name.toLowerCase() === key) continue;
    const typeName = meta.typeName ?? '';
    if (/^(Int32|Int64|String|Guid)$/i.test(typeName) || typeName === '') return hit.field.name;
  }
  return undefined;
}
