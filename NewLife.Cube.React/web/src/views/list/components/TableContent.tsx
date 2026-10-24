/**
 * 列表表格内容（动态列渲染）
 *
 * 每列按 resolveListControl 解析渲染类型：
 * 链接(resolveUrl)/布尔标签/日期/数值/图片缩略图/颜色色块/图标/LOV 翻译/JSON 摘要等。
 */
import { Table, Tag, Tooltip, Button, Popconfirm } from 'antd';
import type { ColumnsType, TablePaginationConfig } from 'antd/es/table';
import type { FieldMapping } from '@newlifex/field-mapping';
import { resolveListControl, isDateOnlyField } from '@/utils/fieldControl';
import { toFieldMeta } from '@/types/field';
import { getFieldRenderer } from '@/rendering/fieldRenderers';
import { getValueByKey, resolveUrl } from '@/utils/url';
import { formatDecimal, formatMoney, formatPercent, parseDecimalScale } from '@/utils/numberFormat';
import { buildTreeRows } from '../utils/treeData';
import { resolveIcon } from '@/utils/icon';
import LovCell from '@/components/field/LovCell';
import type { ListControlType } from '@/types/field';
import { t } from '@/i18n';

export interface TableContentProps {
  fields: FieldMapping[];
  data: Record<string, unknown>[];
  loading?: boolean;
  pkField?: string;
  canView?: boolean;
  canEdit?: boolean;
  canDelete?: boolean;
  /** 软删除字段名（如 Deleted/IsDeleted），存在时已删除行操作列显示「恢复」 */
  softDeleteField?: string;
  selectable?: boolean;
  selectedKeys?: React.Key[];
  onSelectChange?: (keys: React.Key[]) => void;
  onView?: (row: Record<string, unknown>) => void;
  onEdit?: (row: Record<string, unknown>) => void;
  onDelete?: (row: Record<string, unknown>) => void;
  onRestore?: (row: Record<string, unknown>) => void;
  /** 操作列扩展按钮（如角色「权限」），渲染在编辑按钮左侧；可为按行计算的函数 */
  rowActions?:
    | Array<{
        key: string;
        label: React.ReactNode;
        className?: string;
        danger?: boolean;
        onClick: (row: Record<string, unknown>) => void;
      }>
    | ((row: Record<string, unknown>) => Array<{
        key: string;
        label: React.ReactNode;
        className?: string;
        danger?: boolean;
        onClick: (row: Record<string, unknown>) => void;
      }>);
  onSortChange?: (sort?: string, desc?: boolean) => void;
  /** 当前排序列名（配合 onSortChange 受控显示排序指示，仅排序列显示箭头） */
  sortField?: string;
  /** 当前是否降序 */
  sortDesc?: boolean;
  /** 当前页面查询参数，供单元格链接占位符 {page:参数名} 使用 */
  pageQuery?: Record<string, unknown>;
  /** dataAction=action 的链接点击回调（由页面发请求后刷新列表） */
  onDataAction?: (url: string) => void;
  /** 删除是否二次确认（pageSetting.doubleDelete !== false） */
  confirmDelete?: boolean;
  /** 是否允许双击行进入编辑/查看（pageSetting.enableTableDoubleClick !== false） */
  doubleClickEdit?: boolean;
  /** 树形列表父字段名（LIST-17）；传入后按该字段重建树并按父级缩进 */
  treeField?: string;
  /** 页面扩展追加的自定义列（META-6），渲染在元数据列之后、操作列之前 */
  extraColumns?: ColumnsType<Record<string, unknown>>;
  onChange?: (pagination: TablePaginationConfig) => void;
}

/**
 * 后端 TextAligns（0 默认/1 左/2 中/3 右，或字符串 left/center/right）→ antd 列对齐
 *
 * @param value 后端 textAlign 属性（数字枚举或字符串）
 * @returns antd 列对齐；默认/未识别返回 undefined（按控件类型推导）
 */
export function resolveTextAlign(value?: string | number | null): 'left' | 'center' | 'right' | undefined {
  if (value === null || value === undefined || value === '') return undefined;
  if (typeof value === 'number') {
    return value === 1 ? 'left' : value === 2 ? 'center' : value === 3 ? 'right' : undefined;
  }
  const text = String(value).trim().toLowerCase();
  if (text === 'left' || text === 'center' || text === 'right') return text;
  const num = Number(text);
  if (Number.isFinite(num)) return resolveTextAlign(num);
  return undefined;
}

/** 日期格式化。dateOnly 输出 yyyy-MM-dd，否则 yyyy-MM-dd HH:mm:ss（规范 §7.4：日期时间到时分秒） */
function formatDate(v: unknown, dateOnly = false): string {
  if (!v) return '';
  let d: Date;
  if (v instanceof Date) {
    d = v;
  } else {
    const s = String(v);
    d = new Date(s.includes('T') ? s : s.replace(' ', 'T'));
    if (isNaN(d.getTime())) return s;
  }
  const pad = (n: number) => String(n).padStart(2, '0');
  const base = `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
  return dateOnly ? base : `${base} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
}

/** 取单元格值。按字段名顺序取第一个非空值（跳过 undefined/null/空串），供 valueField 取值优先使用 */
function getCellValue(row: Record<string, unknown>, names: string[]): unknown {
  for (const n of names) {
    const v = getValueByKey(row, n);
    if (v !== undefined && v !== null && v !== '') return v;
  }
  return undefined;
}

/** 渲染单元格 */
function CellRenderer({
  field,
  row,
  pageQuery,
  onDataAction,
}: {
  field: FieldMapping;
  row: Record<string, unknown>;
  pageQuery?: Record<string, unknown>;
  onDataAction?: (url: string) => void;
}) {
  const meta = toFieldMeta(field.field);
  const control = resolveListControl(meta);
  // 取值字段：优先取 valueField 指向的字段值（跳过空值），为空回退本字段（如名称列优先显示昵称）
  const raw = meta.valueField ? getCellValue(row, [meta.valueField, meta.name]) : getCellValue(row, [meta.name]);

  // 字段级渲染器优先（后端下发 view，前端注册组件）；未注册时降级内置控件
  const external = getFieldRenderer(meta.view);
  if (external) {
    const Comp = external.component;
    return <Comp field={meta} value={raw} row={row} />;
  }

  switch (control) {
    case 'boolean':
      return <Tag color={raw === true || raw === 'true' || raw === 1 ? 'success' : 'default'}>{raw === true || raw === 'true' || raw === 1 ? t('是') : t('否')}</Tag>;
    case 'date': {
      // 纯日期字段（ItemType=date 或字段名以 Date/day 结尾）只显示日期，其余显示完整时间
      const dateOnly = isDateOnlyField(meta);
      return <span>{formatDate(raw, dateOnly)}</span>;
    }
    case 'time':
      return <span>{formatDate(raw)}</span>;
    case 'number':
      return <span style={{ fontVariantNumeric: 'tabular-nums' }}>{String(raw ?? '')}</span>;
    case 'percent':
      return <span style={{ fontVariantNumeric: 'tabular-nums' }}>{formatPercent(raw, meta)}</span>;
    case 'money':
      return <span style={{ fontVariantNumeric: 'tabular-nums' }}>{formatMoney(raw)}</span>;
    case 'decimal':
      return (
        <span style={{ fontVariantNumeric: 'tabular-nums' }}>
          {formatDecimal(raw, parseDecimalScale(meta.itemType, meta.scale))}
        </span>
      );
    case 'color':
      return raw ? (
        <Tooltip title={String(raw)}>
          <span style={{ display: 'inline-block', width: 18, height: 18, borderRadius: 4, background: String(raw), border: '1px solid var(--cube-border-soft)', verticalAlign: 'middle' }} />
        </Tooltip>
      ) : (
        '-'
      );
    case 'icon':
      return raw ? <span style={{ fontSize: 16 }}>{String(raw)}</span> : '-';
    case 'image':
      return raw ? <img src={String(raw)} alt="" style={{ width: 40, height: 40, objectFit: 'cover', borderRadius: 4 }} /> : '-';
    case 'json':
      return <span style={{ fontFamily: 'monospace', fontSize: 12 }}>{(raw ? String(raw) : '').slice(0, 60)}</span>;
    case 'html':
      return <span style={{ maxWidth: 200, display: 'inline-block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{(raw ? String(raw) : '').replace(/<[^>]+>/g, '').slice(0, 60)}</span>;
    case 'lov':
      return <LovCell value={raw} lovCode={meta.lovCode} dataSource={meta.dataSource} />;
    case 'file':
      return raw ? (
        <a href={String(raw)} target="_blank" rel="noreferrer">
          {t('查看文件')}
        </a>
      ) : (
        '-'
      );
    case 'readonly':
    case 'text':
    default: {
      // 链接字段（支持 {字段} 与 {page:参数} 占位符）。值为空时显示 '-'，不渲染链接
      if (meta.url && raw != null && raw !== '') {
        const href = resolveUrl(meta.url, row, pageQuery);
        const title = meta.title ? resolveUrl(meta.title, row, pageQuery) : undefined;
        // dataAction=action：点击走 AJAX 请求后刷新列表（对齐 MVC data-action），不跳页
        if (meta.dataAction === 'action') {
          return (
            <a
              href={href}
              title={title}
              onClick={(e) => {
                e.preventDefault();
                onDataAction?.(href);
              }}
            >
              {meta.text || String(raw)}
            </a>
          );
        }
        return (
          <a href={href} target={meta.target || '_blank'} title={title} rel="noreferrer">
            {meta.text || String(raw)}
          </a>
        );
      }
      if (meta.url && (raw == null || raw === '')) return <span>-</span>;
      return <span title={meta.title ? resolveUrl(meta.title, row, pageQuery) : undefined}>{String(raw ?? '')}</span>;
    }
  }
}

export default function TableContent({
  fields,
  data,
  loading,
  pkField = 'id',
  canView = false,
  canEdit = true,
  canDelete = true,
  softDeleteField,
  selectable = true,
  selectedKeys,
  onSelectChange,
  onView,
  onEdit,
  onDelete,
  onRestore,
  rowActions,
  onSortChange,
  sortField,
  sortDesc,
  pageQuery,
  onDataAction,
  confirmDelete = true,
  doubleClickEdit = true,
  treeField,
  extraColumns,
  onChange,
}: TableContentProps) {
  const columns: ColumnsType<Record<string, unknown>> = fields.map((field) => {
    const meta = toFieldMeta(field.field);
    const control = resolveListControl(meta);

    // 列宽规范（皮肤设计规范 §7.5）：数字/枚举 ≥80、时间 ≥140、字符串自适应。
    // 主键(Id)列初始宽 52px 且居中（规范 §7.4：主键/ID 居中对齐）：数据少时列窄无大块留白；
    // 长 Id（雪花）由 max-content auto 布局按内容撑开（配合主键列不省略、不排序）。
    // 列多时表格横向滚动，不把各列挤压到无法阅读
    let width: number | undefined;
    if (meta.primaryKey) width = 52;
    else if (control === 'image' || control === 'file') width = 100;
    else if (control === 'color' || control === 'icon') width = 90;
    else if (control === 'boolean') width = 90;
    else if (control === 'number') width = 100;
    else if (control === 'percent' || control === 'money' || control === 'decimal') width = 110;
    else if (control === 'lov') width = 100;
    else if (control === 'date') width = (meta.itemType || '').toLowerCase() === 'date' ? 100 : 140;
    else if (control === 'time') width = 140;

    // 对齐：控制器 textAlign 优先；否则主键列居中（规范 §7.4）、数字右对齐，其余按类型
    const alignResolved =
      resolveTextAlign(meta.textAlign) ??
      (meta.primaryKey
        ? 'center'
        : control === 'number' || control === 'percent' || control === 'money' || control === 'decimal'
          ? 'right'
          : control === 'boolean' || control === 'color' || control === 'icon' || control === 'image'
            ? 'center'
            : 'left');

    // 列头：header 优先于 displayName；headerTitle 以悬浮提示呈现
    const label = meta.header || meta.displayName || meta.name;

    return {
      title: meta.headerTitle ? <Tooltip title={meta.headerTitle}>{label}</Tooltip> : label,
      dataIndex: meta.name,
      key: meta.name,
      width,
      align: alignResolved as 'left' | 'center' | 'right',
      className: meta.class,
      // 最大宽度：超长文本截断到指定字符宽度（对齐 MVC ListField.MaxWidth）
      onCell: () => (meta.maxWidth ? { style: { maxWidth: meta.maxWidth } } : {}),
      // 主键列不参与排序 + 不省略：避免表头排序图标撑宽列、ellipsis 约束 auto 布局下按内容自适应；
      // 配合主键列 64px 初始宽，数据少时列窄、雪花 ID 位数多时列宽
      ellipsis: meta.primaryKey ? false : true,
      sorter: onSortChange && !meta.primaryKey ? true : false,
      // 排序箭头仅当前排序列显示（受控）：其余列 sortOrder 置 null 复位，配合 CSS 隐藏默认箭头
      sortOrder: meta.name === sortField ? (sortDesc ? 'descend' : 'ascend') : null,
      render: (_: unknown, row: Record<string, unknown>) => (
        <CellRenderer field={field} row={row} pageQuery={pageQuery} onDataAction={onDataAction} />
      ),
    };
  });

  // 操作列：查看（只读/无编辑权限时）+ 编辑 + 删除（软删除行显示「恢复」）
  if (extraColumns?.length) columns.push(...extraColumns);
  const isSoftDeleted = (row: Record<string, unknown>) => {
    if (!softDeleteField) return false;
    const v = getValueByKey(row, softDeleteField);
    return v === true || v === 'true' || v === 1;
  };

  const hasRowActions = typeof rowActions === 'function' ? true : !!rowActions?.length;
  if (canView || canEdit || canDelete || hasRowActions) {
    // 操作列宽度按可用操作数自适应：每胶囊按钮约 52px + 单元格 16px 内边距，
    // 仅「查看」时收窄避免大块留白，多操作时撑开容纳按钮
    const opsCount =
      (canView ? 1 : 0) +
      (canEdit ? 1 : 0) +
      (canDelete ? 1 : 0) +
      (typeof rowActions === 'function' ? 1 : (rowActions?.length ?? 0));
    columns.push({
      title: t('操作'),
      key: '__ops',
      width: 16 + 52 * opsCount,
      fixed: 'right',
      render: (_, row) => (
        <span>
          {canView && (
            <Button type="link" size="small" className="cube-op-btn cube-op-btn-op-view" onClick={() => onView?.(row)}>
              {t('查看')}
            </Button>
          )}
          {/* 操作列扩展按钮（如角色「权限」），渲染在编辑按钮左侧 */}
          {(typeof rowActions === 'function' ? rowActions(row) : rowActions)?.map((a) => (
            <Button
              key={a.key}
              type="link"
              size="small"
              className={['cube-op-btn', a.className].filter(Boolean).join(' ')}
              danger={a.danger}
              onClick={() => a.onClick(row)}
            >
              {a.label}
            </Button>
          ))}
          {canEdit && (
            <Button type="link" size="small" className="cube-op-btn cube-op-btn-op-edit" onClick={() => onEdit?.(row)}>
              {t('编辑')}
            </Button>
          )}
          {canDelete &&
            (isSoftDeleted(row) ? (
              <Button type="link" size="small" className="cube-op-btn cube-op-btn-op-restore" onClick={() => onRestore?.(row)}>
                {t('恢复')}
              </Button>
            ) : confirmDelete ? (
              <Popconfirm
                title={t('确定删除该行数据吗？')}
                okText={t('删除')}
                okButtonProps={{ danger: true }}
                onConfirm={() => onDelete?.(row)}
              >
                <Button type="link" size="small" className="cube-op-btn cube-op-btn-op-delete" danger>
                  {t('删除')}
                </Button>
              </Popconfirm>
            ) : (
              <Button
                type="link"
                size="small"
                className="cube-op-btn cube-op-btn-op-delete"
                danger
                onClick={() => onDelete?.(row)}
              >
                {t('删除')}
              </Button>
            ))}
        </span>
      ),
    });
  }

  return (
    <Table<Record<string, unknown>>
      rowKey={(row) => String(getValueByKey(row, pkField) ?? JSON.stringify(row))}
      columns={columns}
      dataSource={treeField ? buildTreeRows(data, pkField, treeField) : data}
      loading={loading}
      size="medium"
      scroll={{ x: 'max-content' }}
      // 树形列表默认全展开（对齐全展开的树视图习惯），仍可手动收起
      expandable={treeField ? { defaultExpandAllRows: true } : undefined}
      // 双击行进入编辑（对齐 MVC：编辑链接 title「双击本行任意地方也可以进入编辑表单页」）；
      // 无编辑权限时可查看，两者都无则无操作。title 悬浮提示双击能力
      onRow={(row) => ({
        title: doubleClickEdit ? (canEdit ? t('双击行进入编辑') : canView ? t('双击行查看详情') : undefined) : undefined,
        onDoubleClick: () => {
          if (!doubleClickEdit) return;
          if (canEdit) onEdit?.(row);
          else if (canView) onView?.(row);
        },
      })}
      rowSelection={
        selectable
          ? {
              selectedRowKeys: selectedKeys,
              onChange: onSelectChange,
            }
          : undefined
      }
      pagination={false}
      onChange={(pagination, _filters, sorter) => {
        if (onSortChange && sorter && !Array.isArray(sorter) && sorter.order) {
          const fieldName = String(sorter.field ?? sorter.columnKey ?? '');
          onSortChange(fieldName, sorter.order === 'descend');
        } else if (onSortChange) {
          onSortChange(undefined, false);
        }
        onChange?.(pagination);
      }}
    />
  );
}
