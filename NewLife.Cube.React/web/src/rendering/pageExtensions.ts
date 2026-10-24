/**
 * 页面级扩展点注册表（META-6：M2 混合页）
 *
 * 呈现架构把页面分为三档：M1 纯元数据动态页、M2 元数据 + 区块插槽的混合页、
 * M3 完全自定义页（由 `views/list/index.tsx` 按路径分发）。本注册表补的是 M2：
 * 业务页面在不放弃元数据驱动的前提下，向列表页注入少量自定义区域。
 *
 * 与 `rendering/fieldRenderers.ts` 同构：按实体路径（大小写不敏感）注册，未注册时
 * 列表页完全走默认渲染，不产生任何额外开销。
 */
import type { ReactNode } from 'react';
import type { ColumnsType } from 'antd/es/table';
import type { FieldMapping } from '@newlifex/field-mapping';
import type { FieldMeta } from '@/types/field';

/** 扩展点通用上下文 */
export interface PageExtensionContext {
  /** 实体路径（如 Admin/User） */
  type: string;
  /** 当前列表查询参数 */
  query: Record<string, unknown>;
  /** 已勾选行主键 */
  selectedKeys: React.Key[];
  /** 重新加载列表 */
  reload: () => void;
}

/** 行操作扩展按钮（渲染在编辑/删除按钮左侧） */
export interface RowActionExtension {
  key: string;
  label: ReactNode;
  className?: string;
  danger?: boolean;
  onClick: (row: Record<string, unknown>) => void;
}

/** 自定义表单体上下文 */
export interface PageFormContext extends PageExtensionContext {
  /** 编辑时为行数据，新增时为 null */
  row: Record<string, unknown> | null;
  /** 表单字段（已按 preset 合并） */
  fields: FieldMapping[];
  /** 提交表单模型（由扩展自行递交；成功后列表页会刷新） */
  onSubmit: (model: Record<string, unknown>) => Promise<void> | void;
  /** 关闭弹窗 */
  onCancel: () => void;
}

/** 页面扩展点 */
export interface PageExtension {
  /** 追加自定义列（渲染在元数据列之后、操作列之前） */
  extraColumns?: (ctx: PageExtensionContext) => ColumnsType<Record<string, unknown>>;
  /** 搜索区追加区块（渲染在搜索按钮右侧，不替换默认搜索控件） */
  searchExtra?: (ctx: PageExtensionContext & { fields: FieldMeta[] }) => ReactNode;
  /** 工具栏追加区块（渲染在工具栏右侧） */
  toolbarExtra?: (ctx: PageExtensionContext) => ReactNode;
  /** 行操作追加（渲染在编辑按钮左侧） */
  rowActions?: (ctx: PageExtensionContext & { row: Record<string, unknown> }) => RowActionExtension[];
  /** 表单体替换（返回非空时替代默认 FormDialog 内容） */
  renderForm?: (ctx: PageFormContext) => ReactNode;
}

const registry = new Map<string, PageExtension>();

/**
 * 注册页面扩展点（同一路径后注册覆盖先注册）
 *
 * @param type 实体路径（大小写不敏感）
 * @param extension 扩展点实现
 */
export function registerPageExtension(type: string, extension: PageExtension): void {
  if (!type) return;
  registry.set(type.toLowerCase(), extension);
}

/**
 * 读取页面扩展点
 *
 * @param type 实体路径（大小写不敏感）
 * @returns 扩展点；未注册返回 null
 */
export function getPageExtension(type?: string | null): PageExtension | null {
  if (!type) return null;
  return registry.get(type.toLowerCase()) ?? null;
}

/** 清空注册表（测试用） */
export function clearPageExtensions(): void {
  registry.clear();
}
