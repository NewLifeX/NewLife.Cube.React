/**
 * 列表工具栏（规范 §7.1/§7.6/§7.8）
 *
 * - 左侧：新增（primary）、删除选中（选中行时显示）、刷新（图标）
 * - 右侧：表格/图表视图切换（Segmented，§7.6）、高级菜单（§7.8 必须项）
 * 高级菜单按类型分组（导出/导入 → 删除 → 开发功能），组间用 divider 分隔，对齐 MVC _List_Toolbar_Adv；
 * 开发功能（备份/还原/备份导出/清空数据表）仅 canDevelop（开发模式+系统管理员）可见。
 */
import { useRef } from 'react';
import { Button, Dropdown, Popconfirm, Segmented, Tooltip } from 'antd';
import type { MenuProps } from 'antd';
import { DeleteOutlined, DownOutlined, PlusOutlined, ReloadOutlined } from '@ant-design/icons';
import { EXPORT_FORMATS, type ToolbarItem } from '@newlifex/cube';
import { getToolbarRenderer } from './toolbarRenderers';
import { t } from '@/i18n';

/** 列表视图模式：表格 / 图表 */
export type ListViewMode = 'table' | 'chart';

export interface ToolbarProps {
  canAdd?: boolean;
  canDelete?: boolean;
  canExport?: boolean;
  canImport?: boolean;
  /** 是否可用开发功能（开发模式+系统管理员）：控制高级菜单 备份/还原/备份导出/清空数据表 */
  canDevelop?: boolean;
  /** 当前是否有搜索条件（有搜索时隐藏 清空数据表，防误删筛选数据，对齐 MVC） */
  hasSearch?: boolean;
  /** 当前页是否有图表数据能力（控制 表格/图表 视图切换显示） */
  canChart?: boolean;
  /** 当前视图 */
  view?: ListViewMode;
  /** 已选中行数（>0 时显示「删除选中」） */
  selectedCount?: number;
  onNew?: () => void;
  /** 删除选中行 */
  onDelete?: () => void;
  /** 删除当前查询的全部数据（高级菜单） */
  onDeleteAll?: () => void;
  onExport?: (format: string) => void;
  onImport?: () => void;
  /** 备份全表到服务器（高级菜单，开发模式） */
  onBackup?: () => void;
  /** 从服务器备份还原（高级菜单，开发模式） */
  onRestore?: () => void;
  /** 备份全表并下载（高级菜单，开发模式） */
  onBackupExport?: () => void;
  /** 清空数据表（高级菜单，开发模式+无搜索条件） */
  onClear?: () => void;
  onViewChange?: (view: ListViewMode) => void;
  onRefresh?: () => void;
  /** 右侧额外按钮（如列设置齿轮），渲染在高级菜单前 */
  columnSetting?: React.ReactNode;
  /** 后端声明的自定义工具栏按钮（meta.toolbar，服务端已按权限过滤） */
  metaToolbar?: ToolbarItem[];
  /** 当前页面查询参数（link 的 appendQuery、include 非 keys 项） */
  pageQuery?: Record<string, unknown>;
  /** 选中行主键（include: keys 时提交） */
  selectedKeys?: React.Key[];
  /** 自定义按钮动作执行：页面负责发请求并处理 message/refresh/url/time */
  onMetaAction?: (item: ToolbarItem, payload: Record<string, unknown>, file?: File) => void | Promise<void>;
  /** 页面扩展插槽（META-6）：追加在工具栏右侧 */
  extra?: React.ReactNode;
}

/**
 * 构造自定义按钮提交载荷（对齐 MVC data-fields）
 *
 * `include` 未声明时仅选中类按钮携带 `keys`；声明后逐项取自选中主键或当前查询参数。
 *
 * @param item 按钮声明
 * @param options 选中主键与当前查询参数
 * @returns 请求载荷
 */
export function buildMetaToolbarPayload(
  item: ToolbarItem,
  options: { selectedKeys?: React.Key[]; pageQuery?: Record<string, unknown> },
): Record<string, unknown> {
  const payload: Record<string, unknown> = {};
  const keys = (options.selectedKeys ?? []).map(String).join(',');
  // 呈现架构 §5：include 默认 ["keys"]；含 keys 时要求先选中数据
  const include = item.include?.length ? item.include : ['keys'];
  for (const field of include) {
    if (field.toLowerCase() === 'keys') payload.keys = keys;
    else if (options.pageQuery && field in options.pageQuery) payload[field] = options.pageQuery[field];
  }
  return payload;
}

/**
 * 构造 link 按钮地址（appendQuery 时附加当前查询参数）
 *
 * @param item 按钮声明
 * @param pageQuery 当前查询参数
 * @returns 完整地址
 */
export function buildMetaLinkUrl(item: ToolbarItem, pageQuery?: Record<string, unknown>): string {
  const url = item.url ?? '';
  if (!item.appendQuery || !pageQuery) return url;
  const qs = new URLSearchParams();
  for (const [k, v] of Object.entries(pageQuery)) {
    if (v !== null && v !== undefined && v !== '') qs.append(k, String(v));
  }
  const text = qs.toString();
  if (!text) return url;
  return `${url}${url.includes('?') ? '&' : '?'}${text}`;
}

export default function Toolbar({
  canAdd = true,
  canDelete = true,
  canExport = true,
  canImport = true,
  canDevelop = false,
  hasSearch = false,
  canChart = false,
  view = 'table',
  selectedCount = 0,
  onNew,
  onDelete,
  onDeleteAll,
  onExport,
  onImport,
  onBackup,
  onRestore,
  onBackupExport,
  onClear,
  onViewChange,
  onRefresh,
  columnSetting,
  metaToolbar,
  pageQuery,
  selectedKeys,
  onMetaAction,
  extra,
}: ToolbarProps) {
  // 上传类按钮各自一个隐藏文件框（按钮同名互不干扰）
  const fileInputs = useRef<Record<string, HTMLInputElement | null>>({});

  /** 渲染后端声明的自定义按钮 */
  const renderMetaButton = (item: ToolbarItem) => {
    const label = item.displayName || item.name;
    const needKeys = item.requiresSelection || (item.include ?? []).some((k) => k.toLowerCase() === 'keys');
    const disabled = needKeys && (selectedKeys?.length ?? 0) === 0;
    const payload = () => buildMetaToolbarPayload(item, { selectedKeys, pageQuery });

    if (item.kind === 'custom') {
      const renderer = getToolbarRenderer(item.renderer);
      if (!renderer) return null;
      const Comp = renderer.component;
      return <Comp key={item.name} item={item} />;
    }

    if (item.kind === 'link') {
      return (
        <Button
          key={item.name}
          href={buildMetaLinkUrl(item, pageQuery)}
          target={item.target || '_self'}
          disabled={disabled}
        >
          {label}
        </Button>
      );
    }

    if (item.kind === 'upload') {
      return (
        <span key={item.name}>
          <Button disabled={disabled} onClick={() => fileInputs.current[item.name]?.click()}>
            {label}
          </Button>
          <input
            ref={(el) => {
              fileInputs.current[item.name] = el;
            }}
            type="file"
            accept={item.accept}
            style={{ display: 'none' }}
            onChange={(e) => {
              const file = e.target.files?.[0];
              e.target.value = '';
              if (file) void onMetaAction?.(item, payload(), file);
            }}
          />
        </span>
      );
    }

    return (
      <Button key={item.name} disabled={disabled} onClick={() => void onMetaAction?.(item, payload())}>
        {label}
      </Button>
    );
  };
  // 高级菜单：导出/导入组 → 删除组 → 开发组（备份/还原/备份导出/清空数据表），组间 divider 分隔
  const advItems: MenuProps['items'] = [];
  if (canExport) {
    advItems.push(
      ...EXPORT_FORMATS.map((f) => ({
        key: `export-${f.key}`,
        label: f.label,
        onClick: () => onExport?.(f.key),
      })),
    );
  }
  if (canImport) {
    advItems.push({ key: 'import', label: t('导入 Excel/Json/Zip'), onClick: () => onImport?.() });
  }
  if (canDelete) {
    advItems.push({ type: 'divider' });
    advItems.push({ key: 'deleteAll', label: t('删除全部'), danger: true, onClick: () => onDeleteAll?.() });
  }
  if (canDevelop) {
    advItems.push({ type: 'divider' });
    advItems.push({ key: 'backup', label: t('备份'), onClick: () => onBackup?.() });
    advItems.push({ key: 'restore', label: t('还原'), onClick: () => onRestore?.() });
    advItems.push({ key: 'backupExport', label: t('备份导出'), onClick: () => onBackupExport?.() });
    if (!hasSearch) {
      advItems.push({ type: 'divider' });
      advItems.push({ key: 'clear', label: t('清空数据表'), danger: true, onClick: () => onClear?.() });
    }
  }

  return (
    <div className="cube-toolbar">
      <div className="cube-toolbar-main">
        {canAdd && (
          <Button type="primary" icon={<PlusOutlined />} onClick={onNew}>
            {t('新增')}
          </Button>
        )}
        {canDelete && selectedCount > 0 && (
          <Popconfirm
            title={t('确定删除选中的 {{count}} 条数据吗？', { count: selectedCount })}
            onConfirm={onDelete}
            okText={t('删除')}
            okButtonProps={{ danger: true }}
          >
            <Button danger icon={<DeleteOutlined />}>
              {t('删除选中 ({{count}})', { count: selectedCount })}
            </Button>
          </Popconfirm>
        )}
        <Tooltip title={t('刷新')}>
          <Button aria-label={t('刷新')} icon={<ReloadOutlined />} onClick={onRefresh} />
        </Tooltip>
        {(metaToolbar ?? []).map(renderMetaButton)}
      </div>
      <div className="cube-toolbar-side">
        {extra}
        {columnSetting}
        {canChart && (
          <Segmented
            size="small"
            value={view}
            options={[
              { label: t('表格'), value: 'table' },
              { label: t('图表'), value: 'chart' },
            ]}
            onChange={(v) => onViewChange?.(v as ListViewMode)}
          />
        )}
        {advItems.length > 0 && (
          <Dropdown menu={{ items: advItems }} placement="bottomRight">
            <Button icon={<DownOutlined />}>{t('高级')}</Button>
          </Dropdown>
        )}
      </div>
    </div>
  );
}
