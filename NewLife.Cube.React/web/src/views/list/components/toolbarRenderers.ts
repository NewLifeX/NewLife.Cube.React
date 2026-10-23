/**
 * 工具栏自定义按钮渲染器注册表（呈现架构 §6.4 / F2）
 *
 * 后端 `meta.toolbar` 的 `kind=custom` 按钮按 `renderer` 名注册组件；
 * 未注册时跳过渲染并告警一次（不阻断其它按钮）。
 */
import type { ComponentType } from 'react';
import type { ToolbarItem } from '@newlifex/api-core';

/** 自定义按钮渲染器入参 */
export interface ToolbarRendererProps {
  /** 后端下发的按钮声明 */
  item: ToolbarItem;
}

/** 渲染器登记项 */
export interface ToolbarRenderer {
  /** 渲染组件 */
  component: ComponentType<ToolbarRendererProps>;
}

const registry = new Map<string, ToolbarRenderer>();
const warned = new Set<string>();

/**
 * 注册工具栏自定义按钮渲染器（同名后注册覆盖先注册）
 *
 * @param name 渲染器名（对应 `meta.toolbar[].renderer`）
 * @param renderer 渲染器
 */
export function registerToolbarRenderer(name: string, renderer: ToolbarRenderer): void {
  if (!name) return;
  registry.set(name, renderer);
  warned.delete(name);
}

/**
 * 取工具栏渲染器；未注册时告警一次并返回 undefined
 *
 * @param name 渲染器名
 * @returns 渲染器或 undefined
 */
export function getToolbarRenderer(name?: string | null): ToolbarRenderer | undefined {
  if (!name) return undefined;
  const hit = registry.get(name);
  if (!hit && !warned.has(name)) {
    warned.add(name);
    console.warn(`[CubeToolbar] 工具栏渲染器未注册：${name}`);
  }
  return hit;
}

/** 清空注册表（测试用） */
export function clearToolbarRenderers(): void {
  registry.clear();
  warned.clear();
}
