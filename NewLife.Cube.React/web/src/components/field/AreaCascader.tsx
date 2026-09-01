/**
 * 省市区级联选择器（对齐 MVC _Area1~_Area4 city-picker）
 *
 * 数据源：后端服务接口 GET /Cube/AreaChilds?id={parentId}（id=0 返回省级），
 * 经 api.client 的 resolveRequestUrl 自动识别服务路径（去掉 /api 前缀）。
 * 层级：maxLevel 1~4（省/市/区/乡镇街道），changeOnSelect 允许选中间级；
 * 值 = 最后选中地区编号（number），后端 Search 会按层级自动向下展开（省→市+区，市→区）。
 * 受控回显：value 为地区编号时经 /Cube/AreaParents?id=&isContainSelf=true 解析父级路径。
 */
import { useEffect, useState } from 'react';
import { Cascader } from 'antd';
import { api } from '@/api';

/** 后端地区节点（/Cube/AreaChilds、/Cube/AreaParents 返回，camelCase；兼容 PascalCase） */
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
}

/** 级联选项（antd Cascader 结构，fieldNames 映射 label=name、value=id） */
export interface AreaOption {
  id: number;
  name: string;
  children?: AreaOption[];
  isLeaf?: boolean;
}

export interface AreaCascaderProps {
  /** 当前选中地区编号（number）。搜索区一般无值；表单编辑回显时传入 */
  value?: number | null;
  /** 值变更回调（传最后选中的地区编号，清除时为 undefined） */
  onChange?: (id: number | undefined) => void;
  /** 最大层级 1~4：1=省、2=省/市、3=省/市/区、4=省/市/区/乡镇街道 */
  maxLevel?: number;
  placeholder?: string;
  disabled?: boolean;
  allowClear?: boolean;
  style?: React.CSSProperties;
}

/** 各层级的默认占位提示（对齐 MVC _Area1~_Area4） */
const PLACEHOLDERS = ['请选择省', '请选择省/市', '请选择省/市/区', '请选择省/市/区/乡镇街道'];

/** 兼容后端 camelCase / PascalCase 字段取值 */
function nodeId(n: AreaNode): number {
  return n.id ?? n.ID;
}
function nodeName(n: AreaNode): string {
  return n.name ?? n.Name;
}

/** 拉取指定地区的子级 */
async function fetchChildren(parentId: number): Promise<AreaOption[]> {
  const res = await api.client.get('/Cube/AreaChilds', { params: { id: parentId } });
  const list = (res.data?.data ?? []) as AreaNode[];
  return list.map((n) => ({ id: nodeId(n), name: nodeName(n), isLeaf: false }));
}

/** 解析地区编号的父级路径（含自身），用于受控回显 */
async function fetchAreaPath(areaId: number): Promise<number[]> {
  const res = await api.client.get('/Cube/AreaParents', { params: { id: areaId, isContainSelf: true } });
  const list = (res.data?.data ?? []) as AreaNode[];
  return list.map(nodeId).filter((id) => id > 0);
}

/**
 * 沿父级路径逐级构建选项树（供受控回显）
 *
 * @param pathIds 父级路径（含自身，从省到叶）
 * @param maxLevel 最大层级
 * @returns 顶层选项树与可回显的路径
 */
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

export default function AreaCascader({
  value,
  onChange,
  maxLevel = 3,
  placeholder,
  disabled,
  allowClear = true,
  style,
}: AreaCascaderProps) {
  const [options, setOptions] = useState<AreaOption[]>([]);
  const [path, setPath] = useState<number[]>([]);
  const [loading, setLoading] = useState(false);

  // 初始加载省级选项
  useEffect(() => {
    let cancelled = false;
    fetchChildren(0).then((opts) => {
      if (cancelled) return;
      // 仅一级时省级即叶子，不显示展开箭头
      setOptions(opts.map((o) => ({ ...o, isLeaf: maxLevel <= 1 })));
    });
    return () => {
      cancelled = true;
    };
  }, [maxLevel]);

  // 受控值 → 解析父级路径回显（表单编辑）
  useEffect(() => {
    if (value == null || value <= 0) {
      setPath([]);
      return;
    }
    // 内部路径末级已与值一致，无需重复解析
    if (path.length > 0 && path[path.length - 1] === value) return;

    let cancelled = false;
    setLoading(true);
    (async () => {
      try {
        const ids = await fetchAreaPath(value);
        if (cancelled || ids.length === 0) return;
        const { root, path: resolved } = await buildAreaTree(ids, maxLevel);
        if (cancelled) return;
        setOptions(root);
        setPath(resolved);
      } catch {
        // 回显失败（地区数据缺失等）保持空态，不打断页面
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value, maxLevel]);

  /** 懒加载子级（antd Cascader loadData 回调） */
  const loadData = async (selected: AreaOption[]) => {
    const target = selected[selected.length - 1];
    if (!target || target.children) return;
    // 当前展开节点为第 selected.length 级（1=省），其子级层级 = selected.length + 1
    const childrenLevel = selected.length + 1;
    const children = await fetchChildren(target.id);
    target.children = children.map((c) => ({ ...c, isLeaf: childrenLevel >= maxLevel }));
    setOptions((prev) => [...prev]);
  };

  const handleChange = (val: number[] | undefined) => {
    setPath(val ?? []);
    const last = val?.[val.length - 1];
    onChange?.(typeof last === 'number' ? last : undefined);
  };

  return (
    <Cascader
      options={options}
      value={path}
      loadData={loadData}
      onChange={handleChange}
      fieldNames={{ label: 'name', value: 'id', children: 'children' }}
      changeOnSelect
      allowClear={allowClear}
      disabled={disabled}
      loading={loading}
      placeholder={placeholder ?? PLACEHOLDERS[Math.min(maxLevel - 1, 3)]}
      style={{ width: '100%', ...style }}
    />
  );
}
