/**
 * 字段级全局渲染器注册表（呈现架构 §6.4 / F1.5）
 *
 * 后端在字段元数据里下发 `view` 名与 `props`，前端按名注册一次组件，
 * 列表单元格、搜索控件、表单控件三处复用；未注册时降级为内置控件并告警一次。
 */
import type { ComponentType } from 'react';
import type { FieldMeta } from '@/types/field';

/** 渲染器组件统一入参 */
export interface FieldRendererProps {
  /** 字段元数据（含后端下发的 props） */
  field: FieldMeta;
  /** 当前值：列表为单元格原始值，搜索/表单为模型值 */
  value: unknown;
  /** 当前行（列表单元格） */
  row?: Record<string, unknown>;
  /** 表单/搜索模型（可选） */
  model?: Record<string, unknown>;
  /** 是否禁用/只读 */
  disabled?: boolean;
  /** 值变更回调（搜索/表单使用） */
  onChange?: (value: unknown) => void;
}

/** 渲染器登记项 */
export interface FieldRenderer {
  /** 渲染组件 */
  component: ComponentType<FieldRendererProps>;
}

const registry = new Map<string, FieldRenderer>();
const warned = new Set<string>();

/**
 * 注册字段渲染器（同名后注册覆盖先注册）
 *
 * @param name 渲染器名（对应后端字段的 `view`）
 * @param renderer 渲染器
 */
export function registerFieldRenderer(name: string, renderer: FieldRenderer): void {
  if (!name) return;
  registry.set(name, renderer);
  warned.delete(name);
}

/**
 * 取字段渲染器；未注册时告警一次并返回 undefined（调用方回退内置控件）
 *
 * @param name 渲染器名
 * @returns 渲染器或 undefined
 */
export function getFieldRenderer(name?: string | null): FieldRenderer | undefined {
  if (!name) return undefined;
  const hit = registry.get(name);
  if (!hit && !warned.has(name)) {
    warned.add(name);
    console.warn(`[CubeField] 字段渲染器未注册：${name}`);
  }
  return hit;
}

/** 清空注册表（测试用） */
export function clearFieldRenderers(): void {
  registry.clear();
  warned.clear();
}
