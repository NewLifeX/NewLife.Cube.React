/**
 * 地区选择数据层（级联下拉 / 多Tab弹层共用）
 *
 * 数据源：GET /Cube/AreaChilds?id={parentId}（id=0 返回省级，含 bigArea 大区字段）、
 * GET /Cube/AreaParents?id=&isContainSelf=true（父级路径），经 api.client 的 resolveRequestUrl
 * 自动识别服务路径（去掉 /api 前缀）。
 */
import { api } from '@/api';
import { t } from '@/i18n';

/** 后端地区节点（camelCase；兼容 PascalCase） */
export interface AreaNode {
  ID: number;
  Name: string;
  FullName?: string;
  Level?: number;
  ParentID?: number;
  /** 后端 camelCase 序列化字段（与 PascalCase 二选一） */
  id?: number;
  name?: string;
  fullName?: string;
  level?: number;
  parentId?: number;
  /** 大区（华北/华东/华中/华南/西南/西北/东北），省级返回 */
  bigArea?: string;
  BigArea?: string;
}

/** 级联选项（antd Cascader / 多Tab弹层共用） */
export interface AreaOption {
  id: number;
  name: string;
  /** 大区（省份项，用于 tabs 方案分组） */
  bigArea?: string;
  children?: AreaOption[];
  isLeaf?: boolean;
}

/** 各层级的默认占位提示（对齐 MVC _Area1~_Area4） */
export const placeholders = () => [t('请选择省'), t('请选择省/市'), t('请选择省/市/区'), t('请选择省/市/区/乡镇街道')];

/** tab 名称（对齐 MVC city-picker tab 栏） */
export const tabNames = () => [t('省份'), t('城市'), t('区县'), t('乡镇街道')];

/** 兼容后端 camelCase / PascalCase 字段取值 */
export function nodeId(n: AreaNode): number {
  return n.id ?? n.ID;
}
export function nodeName(n: AreaNode): string {
  return n.name ?? n.Name;
}
function nodeBigArea(n: AreaNode): string {
  return n.bigArea ?? n.BigArea ?? '';
}

/** 拉取指定地区的子级（id=0 返回省级，含大区） */
export async function fetchChildren(parentId: number): Promise<AreaOption[]> {
  const res = await api.client.get('/Cube/AreaChilds', { params: { id: parentId } });
  const list = (res.data?.data ?? []) as AreaNode[];
  return list.map((n) => ({ id: nodeId(n), name: nodeName(n), bigArea: nodeBigArea(n), isLeaf: false }));
}

/** 解析地区编号的父级路径（含自身），用于受控回显 */
export async function fetchAreaPath(areaId: number): Promise<number[]> {
  const res = await api.client.get('/Cube/AreaParents', { params: { id: areaId, isContainSelf: true } });
  const list = (res.data?.data ?? []) as AreaNode[];
  return list.map(nodeId).filter((id) => id > 0);
}

/** 沿父级路径逐级构建选项树（供级联下拉回显） */
export async function buildAreaTree(
  pathIds: number[],
  maxLevel: number,
): Promise<{ root: AreaOption[]; path: number[] }> {
  const root = await fetchChildren(0);
  let nodes = root;
  const path: number[] = [];
  for (let i = 0; i < pathIds.length && i < maxLevel; i++) {
    const target = nodes.find((n) => n.id === pathIds[i]);
    if (!target) break;
    path.push(target.id);
    if (i < maxLevel - 1) {
      const children = await fetchChildren(target.id);
      target.children = children;
      target.isLeaf = false;
      nodes = children;
    } else {
      target.isLeaf = true;
    }
  }
  return { root, path };
}

/** 按大区分组（省份列表 → 华北/华东/… 分组） */
export function groupByBigArea(list: AreaOption[]): { bigArea: string; list: AreaOption[] }[] {
  const map = new Map<string, AreaOption[]>();
  for (const o of list) {
    const key = o.bigArea?.trim() || t('其他');
    if (!map.has(key)) map.set(key, []);
    map.get(key)!.push(o);
  }
  return [...map.entries()].map(([bigArea, items]) => ({ bigArea, list: items }));
}
