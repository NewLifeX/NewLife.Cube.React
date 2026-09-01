/**
 * 角色权限弹窗纯逻辑（可独立单测）
 *
 * 与后端 Role.Permission 字符串格式（"id#flag,id#flag"）保持一致；
 * 级联快捷：点击一级菜单的 只读/全部/无权限 应用到当前菜单及所有子孙菜单。
 */

/** 权限树节点（与后端 /Admin/Role/PermissionTree 返回结构对应） */
export interface PermissionNode {
  id: number;
  name: string;
  displayName: string;
  /** 该菜单可用权限位（PermissionFlags：1 查看/2 添加/4 修改/8 删除，>8 为自定义权限项） */
  flags?: Array<{ value: number; name: string }>;
  /** 当前角色已授权位 */
  granted?: number;
  children?: PermissionNode[];
}

/** 全部权限位（PermissionFlags.All = 0xFFFFFFFF）。后端枚举为 UInt32，落库/解析用 Int32 负数表示 */
export const PERMISSION_ALL = 0xffffffff;

/** 快捷授权模式 */
export type QuickMode = 'readonly' | 'all' | 'none';

/**
 * 收集指定菜单及其所有子孙菜单的 id 列表（含自身）
 * @param nodes 权限树（顶层数组）
 * @param id 目标菜单编号
 * @returns id 列表；菜单不存在时返回空数组
 */
export function collectSubtreeIds(nodes: PermissionNode[], id: number): number[] {
  const find = (list: PermissionNode[]): PermissionNode | null => {
    for (const n of list) {
      if (n.id === id) return n;
      if (n.children?.length) {
        const hit = find(n.children);
        if (hit) return hit;
      }
    }
    return null;
  };
  const node = find(nodes);
  if (!node) return [];

  const ids: number[] = [];
  const walk = (n: PermissionNode) => {
    ids.push(n.id);
    n.children?.forEach(walk);
  };
  walk(node);
  return ids;
}

/**
 * 计算快捷授权在目标菜单（含所有子孙）上的授予结果
 * @param nodes 权限树（顶层数组）
 * @param id 目标菜单编号
 * @param mode 模式：readonly=仅查看(1)、all=全部权限位(0xFFFFFFFF)、none=无权限（不写入）
 * @returns 菜单 id → 权限位 映射；无权限模式返回空对象（清除即删除）
 */
export function buildQuickGranted(nodes: PermissionNode[], id: number, mode: QuickMode): Record<number, number> {
  const ids = collectSubtreeIds(nodes, id);
  const out: Record<number, number> = {};
  for (const menuId of ids) {
    if (mode === 'readonly') out[menuId] = 1;
    else if (mode === 'all') out[menuId] = PERMISSION_ALL;
    // none：不写入，保存时视为无权限（从字典删除）
  }
  return out;
}

/**
 * 序列化权限字典为 "id#flag,id#flag"（按 id 升序，过滤 0）
 *
 * ⚠️ PermissionFlags 为 UInt32，后端 Role.SavePermission 用 (Int32) 序列化、RolePermissionHelper.Apply 用
 * Int32.TryParse 解析：All(0xFFFFFFFF) 必须转 Int32 -1（`flag | 0`），否则发送 "4294967295" 溢出解析失败被跳过。
 */
export function serializePermissions(grantedMap: Record<number, number>): string {
  return Object.entries(grantedMap)
    .filter(([, f]) => f)
    .map(([id, f]) => `${id}#${f | 0}`)
    .sort((a, b) => parseInt(a, 10) - parseInt(b, 10))
    .join(',');
}
