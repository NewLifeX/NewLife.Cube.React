/**
 * 实体列表页（内层组件，无探测/早退逻辑）
 *
 * 由 DefaultListPage 包装组件探测后调用：确认当前页面为实体 CRUD 页后渲染。
 * 本组件与原始 DefaultListPage 行为一致：从后端 meta 拉取 list/search/addForm/editForm
 * 字段元数据，由 @newlifex/page-logic zustand store 驱动，分片渲染：
 *   - SearchBar      动态搜索控件（按钮与条件同行）
 *   - Toolbar        新增/删除选中/刷新 + 表格图表视图切换 + 高级菜单
 *   - TableContent   动态列渲染
 *   - ListPagination 分页 + 统计行
 *   - FormDialog     命令式新增/编辑弹窗（FieldControl）
 *   - ChartView      图表视图（表格/图表 Segmented 切换，规范 §7.6）
 */
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { App, Card } from 'antd';
import { useLocation } from 'react-router-dom';
import { clearPageMetaCache } from '@newlifex/api-core';
import { getValueByKey, parseUrlQuery } from '@/utils/url';
import { mapUrlParamsToSearchValues } from '@/utils/fieldControl';
import { toFieldMeta } from '@/types/field';
import { api } from '@/api';
import { usePageStore } from '@/hooks/usePageStore';
import SearchBar from './components/SearchBar';
import Toolbar, { type ListViewMode } from './components/Toolbar';
import TableContent from './components/TableContent';
import ColumnSetting, { filterVisibleFields } from './components/ColumnSetting';
import ListPagination from './components/ListPagination';
import ChartView from './components/ChartView';
import FormDialog from '@/views/form/FormDialog';
import DetailDialog from '@/views/form/DetailDialog';
import { t } from '@/i18n';
import PermissionDialog from './components/PermissionDialog';

export interface EntityListPageProps {
  /** 实体路径前缀，如 '/Admin/User'、'/Cube/App' */
  type: string;
}

export default function EntityListPage({ type }: EntityListPageProps) {
  const { message, modal } = App.useApp();
  const store = usePageStore(type);
  const location = useLocation();
  // 外部跳转携带的查询参数（如工作台指标卡跳转日志页 ?dtStart=...&success=false）
  const urlQuery = useMemo(() => parseUrlQuery(location.search), [location.search]);

  // 订阅 store 状态
  const listFields = store((s) => s.listFields);
  const allListFields = store((s) => s.allListFields);
  const searchFields = store((s) => s.searchFields);
  const addFields = store((s) => s.addFields);
  const editFields = store((s) => s.editFields);
  const detailFields = store((s) => s.detailFields);
  const pageSetting = store((s) => s.pageSetting);
  const tableData = store((s) => s.tableData);
  const statData = store((s) => s.statData);
  const pagination = store((s) => s.pagination);
  const loading = store((s) => s.loading);
  const formLoading = store((s) => s.formLoading);
  const pkField = store((s) => s.pkField);
  const canAdd = store((s) => s.canAdd);
  const canEdit = store((s) => s.canEdit);
  const canDelete = store((s) => s.canDelete);
  const canExport = store((s) => s.canExport);
  const canImport = store((s) => s.canImport);
  const canDevelop = store((s) => s.canDevelop);
  // 图表数据。必须在组件顶部无条件订阅（zustand selector 是 hook），
  // 不能在 JSX 条件分支内调用，否则切到图表视图时 hooks 数量变化触发 React #310
  const chartList = store((s) => s.chartList);

  // 查看权限：只读控制器或无可编辑权限时提供「查看」（规范 §7.9）
  const canView = !!pageSetting?.isReadOnly || !canEdit;

  // 渲染列：过滤后端 meta 标记隐藏（visible=false）的字段（列设置持久化到后端后由 meta 干预）
  const displayFields = useMemo(() => filterVisibleFields(listFields), [listFields]);
  const visibleFieldNames = useMemo(() => displayFields.map((f) => f.field.name), [displayFields]);

  // 软删除字段：列表字段含 Deleted/IsDelete/IsDeleted 布尔字段时启用「恢复」（规范 §7.9）
  const softDeleteField = useMemo(
    () =>
      listFields.find(
        (f) => /^(deleted|isdelete|isdeleted)$/i.test(f.field.name) && f.field.typeName === 'Boolean',
      )?.field.name,
    [listFields],
  );

  const [searchParams, setSearchParams] = useState<Record<string, unknown>>(() => ({ ...urlQuery }));
  // 当前是否有搜索条件：有搜索时隐藏高级菜单「清空数据表」，防误删筛选后的数据（对齐 MVC page.Params.Count==0）
  const hasSearch = Object.keys(searchParams).length > 0;
  const [selectedKeys, setSelectedKeys] = useState<React.Key[]>([]);
  // 当前排序状态：驱动表头排序箭头受控显示（仅排序列显示）
  const [sortState, setSortState] = useState<{ field?: string; desc: boolean }>({ desc: false });
  const [dialog, setDialog] = useState<{ open: boolean; mode: 'add' | 'edit'; row?: Record<string, unknown> | null }>({
    open: false,
    mode: 'add',
  });
  const [detailDialog, setDetailDialog] = useState<{ open: boolean; row?: Record<string, unknown> | null }>({
    open: false,
    row: null,
  });
  // 角色页权限配置弹窗（操作列「权限」按钮，对齐 MVC 角色授权）
  const isRole = type.toLowerCase().endsWith('/role');
  const [permDialog, setPermDialog] = useState<{ open: boolean; row?: Record<string, unknown> | null }>({
    open: false,
    row: null,
  });
  const [view, setView] = useState<ListViewMode>('table');
  const [canChart, setCanChart] = useState(false);
  const importInputRef = useRef<HTMLInputElement>(null);

  // 页面加载：拉字段元数据 + 列表数据（携带 URL 查询参数，如工作台指标卡跳转）
  useEffect(() => {
    let cancelled = false;
    store
      .getState()
      .loadFields()
      .then(() => {
        if (cancelled) return;
        return store.getState().loadData(urlQuery);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [type, location.search]);

  // URL 查询参数变化（外部跳转携带新条件）时同步 searchParams，驱动 hasSearch/刷新等
  useEffect(() => {
    setSearchParams(Object.keys(urlQuery).length ? { ...urlQuery } : {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.search]);

  // 图表能力探测：加载一次，无图表数据的页面不显示 表格/图表 视图切换（§7.6）
  useEffect(() => {
    let cancelled = false;
    store
      .getState()
      .loadChart()
      .then((list) => {
        if (!cancelled) setCanChart(list.length > 0);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [type]);

  const refresh = useCallback(() => {
    // 保留当前排序参数，刷新/删除后列表排序与表头箭头保持一致
    return store
      .getState()
      .loadData({ ...searchParams, sort: sortState.field, desc: sortState.desc })
      .catch(() => {});
  }, [store, searchParams, sortState]);

  // 列设置保存/恢复默认后：清除页面元数据缓存 + 重新拉取（meta 返回已应用配置的字段）+ 数据
  const reloadMeta = useCallback(() => {
    clearPageMetaCache();
    void store
      .getState()
      .loadFields()
      .then(() => store.getState().loadData({ ...searchParams, sort: sortState.field, desc: sortState.desc }));
  }, [store, searchParams, sortState]);

  // ── 事件处理 ─────────────────────────────────────────
  const handleSearch = (params: Record<string, unknown>) => {
    setSearchParams(params);
    // 搜索/重置时清空排序状态，避免表头箭头与后端排序参数不一致
    setSortState({ desc: false });
    store.getState().setPagination(1);
    void store.getState().loadData(params);
  };

  const handleReset = () => {
    setSearchParams({});
    setSortState({ desc: false });
    store.getState().setPagination(1);
    void store.getState().loadData();
  };

  const handleNew = () => setDialog({ open: true, mode: 'add' });

  const handleEditRow = (row: Record<string, unknown>) => setDialog({ open: true, mode: 'edit', row });

  const handleDeleteRow = (row: Record<string, unknown>) => {
    const id = getValueByKey(row, pkField) ?? getValueByKey(row, 'id');
    void store
      .getState()
      .remove(String(id))
      .then(() => {
        message.success(t('删除成功'));
        void refresh();
      })
      .catch((err) => {
        // 业务错误已由 api-core 统一提示，这里兜底
        message.error((err as Error)?.message || t('删除失败'));
      });
  };

  const handleViewRow = (row: Record<string, unknown>) => setDetailDialog({ open: true, row });

  /** 角色页：打开权限配置弹窗（编辑按钮左侧「权限」） */
  const handlePermRow = (row: Record<string, unknown>) => setPermDialog({ open: true, row });

  const rowActions = isRole
    ? [
        {
          key: 'permission',
          label: t('权限'),
          className: 'cube-op-btn-op-perm',
          onClick: handlePermRow,
        },
      ]
    : undefined;

  const handleRestoreRow = (row: Record<string, unknown>) => {
    const id = getValueByKey(row, pkField) ?? getValueByKey(row, 'id');
    void store
      .getState()
      .restore(String(id))
      .then(() => {
        message.success(t('恢复成功'));
        void refresh();
      })
      .catch((err: unknown) => {
        message.error((err as Error)?.message || t('恢复失败'));
      });
  };

  const handleDeleteSelected = () => {
    const keys = selectedKeys.map(String);
    if (!keys.length) return;
    void store
      .getState()
      .deleteSelect(keys)
      .then(() => {
        message.success(t('删除成功'));
        setSelectedKeys([]);
        void refresh();
      })
      .catch((err) => {
        message.error((err as Error)?.message || t('删除失败'));
      });
  };

  /** 导出：axios 携带 token 获取文件流后触发浏览器下载（对齐 Vue exportData，window.open 无法携带 Bearer 头）。
   *  携带当前搜索条件与排序，后端基于查询条件全量导出（ExportData 全页拉取），而非整表或仅当前页 */
  const handleExport = async (format: string) => {
    try {
      const res = await api.client.get(`${type}/export`, {
        params: { format, ...searchParams, sort: sortState.field, desc: sortState.desc },
        responseType: 'blob',
      });
      const blob = res.data as Blob;
      const name = type.split('/').filter(Boolean).pop() || 'export';
      downloadBlob(blob, `${name}_${dateStamp()}${blobExt(blob.type)}`);
      message.success(t('导出成功'));
    } catch (err) {
      message.error((err as Error)?.message || t('导出失败'));
    }
  };

  const handleImport = () => importInputRef.current?.click();

  const onImportFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    void store
      .getState()
      .importFile(file)
      .then(() => {
        message.success(t('导入成功'));
        void refresh();
      });
  };

  /** 切换表格/图表视图：切到图表时重新拉取图表数据 */
  const handleViewChange = (v: ListViewMode) => {
    setView(v);
    if (v === 'chart') {
      void store.getState().loadChart().then((list) => {
        if (list.length) setCanChart(true);
        else setCanChart(false);
      });
    }
  };

  /** 删除当前查询条件下的全部数据（高级菜单，二次确认） */
  const handleDeleteAll = () => {
    modal.confirm({
      title: t('删除全部'),
      content: t('确定删除当前查询条件下的所有数据吗？此操作不可恢复！'),
      okText: t('删除'),
      okButtonProps: { danger: true },
      cancelText: t('取消'),
      onOk: async () => {
        try {
          await store.getState().deleteAll(searchParams);
          message.success(t('删除成功'));
          setSelectedKeys([]);
          void refresh();
        } catch (err) {
          message.error((err as Error)?.message || t('删除失败'));
        }
      },
    });
  };

  /** 备份全表到服务器（高级菜单，开发模式。对齐 MVC Develop?act=Backup） */
  const handleBackup = async () => {
    try {
      const res = await api.client.get(`${type}/Develop`, { params: { act: 'Backup' } });
      message.success((res.data as { message?: string })?.message || t('备份成功'));
    } catch (err) {
      message.error((err as Error)?.message || t('备份失败'));
    }
  };

  /** 从服务器备份目录还原（高级菜单，开发模式。对齐 MVC Develop?act=Restore） */
  const handleRestore = async () => {
    try {
      const res = await api.client.get(`${type}/Develop`, { params: { act: 'Restore' } });
      message.success((res.data as { message?: string })?.message || t('还原成功'));
    } catch (err) {
      message.error((err as Error)?.message || t('还原失败'));
    }
  };

  /** 备份全表并下载 gz 文件（高级菜单，开发模式。对齐 MVC Develop?act=BackupAndExport） */
  const handleBackupExport = async () => {
    try {
      const res = await api.client.get(`${type}/Develop`, {
        params: { act: 'BackupAndExport' },
        responseType: 'blob',
      });
      const blob = res.data as Blob;
      const name = type.split('/').filter(Boolean).pop() || 'export';
      downloadBlob(blob, `${name}_${dateStamp()}.gz`);
      message.success(t('备份导出成功'));
    } catch (err) {
      message.error((err as Error)?.message || t('备份导出失败'));
    }
  };

  /** 清空数据表全部数据（高级菜单，开发模式+无搜索条件，二次确认。对齐 MVC Develop?act=Clear） */
  const handleClear = () => {
    modal.confirm({
      title: t('清空数据表'),
      content: t('确定删除数据表所有数据并不可恢复？确认清空？'),
      okText: t('清空'),
      okButtonProps: { danger: true },
      cancelText: t('取消'),
      onOk: async () => {
        try {
          const res = await api.client.get(`${type}/Develop`, { params: { act: 'Clear' } });
          message.success((res.data as { message?: string })?.message || t('清空成功'));
          setSelectedKeys([]);
          void refresh();
        } catch (err) {
          message.error((err as Error)?.message || t('清空失败'));
        }
      },
    });
  };

  const handlePageChange = (page: number, pageSize?: number) => {
    store.getState().setPagination(page, pageSize);
    // 翻页保留当前排序参数，列表数据与表头箭头保持一致
    void store.getState().loadData({ ...searchParams, sort: sortState.field, desc: sortState.desc });
  };

  const handleSortChange = (sort?: string, desc?: boolean) => {
    setSortState({ field: sort, desc: !!desc });
    void store.getState().loadData({ ...searchParams, sort, desc });
  };

  const handleFormSubmit = async (data: Record<string, unknown>) => {
    try {
      if (dialog.mode === 'edit') {
        await store.getState().update(data);
      } else {
        await store.getState().add(data);
      }
      message.success(dialog.mode === 'edit' ? t('更新成功') : t('新增成功'));
      setDialog({ open: false, mode: 'add', row: null });
      void refresh();
    } catch (err) {
      message.error((err as Error)?.message || t('保存失败'));
    }
  };

  const editFieldsForDialog = editFields.length ? editFields : addFields;
  const formFields = dialog.mode === 'edit' ? editFieldsForDialog : addFields;

  // 外部 URL 查询参数 → 搜索控件值（回显到搜索区），如工作台指标卡跳转日志页 ?dtStart=...&success=false
  const searchInitialValues = useMemo(
    () => mapUrlParamsToSearchValues(urlQuery, searchFields.map((f) => toFieldMeta(f.field))),
    [urlQuery, searchFields],
  );

  return (
    // 页面名由顶栏面包屑/多标签承担，Card 不再重复标题（避免搜索区上方冗余占位）
    <Card className="cube-entity-card" size="small" styles={{ body: { paddingTop: 8 } }}>
      <SearchBar fields={searchFields} onSearch={handleSearch} onReset={handleReset} initialValues={searchInitialValues} />
      <Toolbar
        canAdd={canAdd}
        canDelete={canDelete}
        canExport={canExport}
        canImport={canImport}
        canDevelop={canDevelop}
        hasSearch={hasSearch}
        canChart={canChart}
        view={view}
        selectedCount={selectedKeys.length}
        onNew={handleNew}
        onDelete={handleDeleteSelected}
        onDeleteAll={handleDeleteAll}
        onExport={handleExport}
        onImport={handleImport}
        onBackup={handleBackup}
        onRestore={handleRestore}
        onBackupExport={handleBackupExport}
        onClear={handleClear}
        onViewChange={handleViewChange}
        onRefresh={() => void refresh()}
        columnSetting={
          <ColumnSetting type={type} allFields={allListFields} visibleFields={visibleFieldNames} onChanged={reloadMeta} />
        }
      />
      {view === 'chart' ? (
        <ChartView charts={chartList} />
      ) : (
        <>
          <TableContent
            fields={displayFields}
            data={tableData}
            loading={loading}
            pkField={pkField}
            canView={canView}
            canEdit={canEdit}
            canDelete={canDelete}
            softDeleteField={softDeleteField}
            selectedKeys={selectedKeys}
            onSelectChange={setSelectedKeys}
            onView={handleViewRow}
            onEdit={handleEditRow}
            onDelete={handleDeleteRow}
            onRestore={handleRestoreRow}
            rowActions={rowActions}
            onSortChange={handleSortChange}
            sortField={sortState.field}
            sortDesc={sortState.desc}
          />
          <div className="cube-table-footer">
            <ListPagination
              total={pagination.totalCount}
              current={pagination.pageIndex}
              pageSize={pagination.pageSize}
              statData={statData}
              onChange={handlePageChange}
            />
          </div>
        </>
      )}

      {/* 导入：隐藏文件选择框 */}
      <input ref={importInputRef} type="file" accept=".xls,.xlsx,.csv,.json,.zip" style={{ display: 'none' }} onChange={onImportFileChange} />

      {/* 新增/编辑弹窗 */}
      <FormDialog
        open={dialog.open}
        title={dialog.mode === 'edit' ? t('编辑') : t('新增')}
        mode={dialog.mode}
        fields={formFields}
        row={dialog.row}
        apiPrefix={type}
        submitting={formLoading}
        onSubmit={handleFormSubmit}
        onCancel={() => setDialog({ open: false, mode: 'add', row: null })}
      />

      {/* 详情弹窗（操作列「查看」） */}
      <DetailDialog
        open={detailDialog.open}
        apiPrefix={type}
        id={
          detailDialog.row
            ? ((getValueByKey(detailDialog.row, pkField) ?? getValueByKey(detailDialog.row, 'id')) as string | number | null)
            : null
        }
        fields={detailFields.length ? detailFields : listFields}
        row={detailDialog.row}
        onClose={() => setDetailDialog({ open: false, row: null })}
      />

      {/* 角色页：权限配置弹窗（操作列「权限」按钮） */}
      {isRole && (
        <PermissionDialog
          open={permDialog.open}
          roleId={
            permDialog.row
              ? ((getValueByKey(permDialog.row, pkField) ?? getValueByKey(permDialog.row, 'id')) as number)
              : undefined
          }
          roleName={permDialog.row ? String(getValueByKey(permDialog.row, 'Name') ?? '') : undefined}
          onClose={() => setPermDialog({ open: false, row: null })}
          onSaved={() => void refresh()}
        />
      )}
    </Card>
  );
}

// ── 导出辅助（对齐 Vue core/views/index.vue）──────────────────────

/** 触发浏览器下载 Blob */
function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/** 根据响应 content-type 推断导出文件扩展名 */
function blobExt(contentType: string): string {
  if (contentType.includes('csv')) return '.csv';
  if (contentType.includes('json')) return '.json';
  if (contentType.includes('zip')) return '.zip';
  // xlsx 的 content-type 为 ...openxmlformats...spreadsheetml.sheet，内含 "xml" 子串，必须在 xml 之前识别
  if (contentType.includes('spreadsheetml') || contentType.includes('excel')) return '.xlsx';
  if (contentType.includes('xml')) return '.xml';
  return '.bin';
}

/** 生成时间戳文件名片段（yyyyMMddHHmmss） */
function dateStamp(): string {
  const d = new Date();
  const p = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}${p(d.getMonth() + 1)}${p(d.getDate())}${p(d.getHours())}${p(d.getMinutes())}${p(d.getSeconds())}`;
}
