/**
 * 搜索栏（动态搜索控件）
 *
 * 依据 resolveSearchControl 渲染 text / numberRange / dateRange / datetimeRange /
 * timeRange / lov / lovMulti / switch / fileExists 控件。
 * 布局：条件与操作按钮（搜索/重置/展开）同一 flex-wrap 容器，按钮落在最后一行右侧，
 * 行满时自动换行并靠右对齐（对齐主流 QueryFilter 与规范 §7.2）。
 * 搜索参数约定（对齐 Vue）：
 * - 文本/值集/开关 → formData[field]
 * - 数值/时间范围 → formData[`${field}_min`] / formData[`${field}_max`]
 * - 日期/日期时间范围 → formData[field] = [start, end]
 */
import { useEffect, useMemo, useRef, useState } from 'react';
import { Button, DatePicker, Input, InputNumber, Select, Space, Switch, TimePicker } from 'antd';
import { DownOutlined, UpOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import LovSelect from '@/components/field/LovSelect';
import FocusClearInput from '@/components/field/FocusClearInput';
import AreaCascader from '@/components/field/AreaCascader';
import { resolveSearchControl, resolveAreaMaxLevel } from '@/utils/fieldControl';
import { toFieldMeta } from '@/types/field';
import { getFieldRenderer } from '@/rendering/fieldRenderers';
import type { FieldMapping } from '@newlifex/field-mapping';
import type { FieldMeta, SearchControlType } from '@/types/field';
import { useReactSetting } from '@/stores/reactSetting';
import { t } from '@/i18n';

export interface SearchBarProps {
  fields: FieldMapping[];
  onSearch: (params: Record<string, unknown>) => void;
  onReset: () => void;
  /** 外部 URL 查询参数映射的初始搜索值（如工作台指标卡跳转日志页），变化时回填表单 */
  initialValues?: Record<string, unknown>;
  /** 页面扩展插槽（META-6）：追加在搜索/重置按钮右侧 */
  extra?: React.ReactNode;
}

/** 范围类控件（占 2 格，避免被压缩） */
const RANGE_CONTROLS: SearchControlType[] = ['numberRange', 'dateRange', 'datetimeRange', 'timeRange'];

/** 最小格子宽度，与 entity.css 中 .cube-search-grid 的 minmax 保持一致 */
const MIN_CELL = 200;

/** 折叠时最多显示的行数（规范 §7.2：条件多时折叠，避免挤压表格） */
const MAX_ROWS = 2;

/** 是否范围类控件 */
function isRangeControl(control: SearchControlType): boolean {
  return RANGE_CONTROLS.includes(control);
}

/** 单字段搜索控件 */
function SearchControl({
  field,
  control,
  value,
  onChange,
}: {
  field: FieldMapping;
  control: SearchControlType;
  value: unknown;
  onChange: (value: unknown) => void;
}) {
  const meta = toFieldMeta(field.field);
  const placeholder = t('请输入{{name}}', { name: meta.displayName || meta.name });
  const label = meta.displayName || meta.name;
  // React 皮肤设置：搜索文本框清除图标开关
  const { inputClear } = useReactSetting();

  // 字段级渲染器优先（后端下发 view，前端注册组件）
  const external = getFieldRenderer(meta.view);
  if (external) {
    const Comp = external.component;
    return <Comp field={meta} value={value} onChange={onChange} />;
  }

  switch (control) {
    case 'text':
      return (
        <FocusClearInput
          showClear={inputClear}
          placeholder={placeholder}
          value={(value as string) ?? ''}
          onChange={(e) => onChange(e.target.value || undefined)}
        />
      );
    case 'numberRange': {
      const range = Array.isArray(value) ? (value as [number | null, number | null]) : [null, null];
      return (
        <Space.Compact style={{ width: '100%' }}>
          <InputNumber
            placeholder={t('最小值')}
            value={range[0]}
            onChange={(v) => onChange([v, range[1]])}
            style={{ width: '50%' }}
          />
          <InputNumber
            placeholder={t('最大值')}
            value={range[1]}
            onChange={(v) => onChange([range[0], v])}
            style={{ width: '50%' }}
          />
        </Space.Compact>
      );
    }
    case 'dateRange': {
      const range = Array.isArray(value) ? (value as [string, string]) : null;
      return (
        <DatePicker.RangePicker
          value={range ? [dayjs(range[0]), dayjs(range[1])] : null}
          onChange={(dates) => onChange(dates ? [dates[0]?.format('YYYY-MM-DD'), dates[1]?.format('YYYY-MM-DD')] : undefined)}
          style={{ width: '100%' }}
        />
      );
    }
    case 'datetimeRange': {
      const range = Array.isArray(value) ? (value as [string, string]) : null;
      return (
        <DatePicker.RangePicker
          showTime
          value={range ? [dayjs(range[0]), dayjs(range[1])] : null}
          onChange={(dates) =>
            onChange(dates ? [dates[0]?.toISOString(), dates[1]?.toISOString()] : undefined)
          }
          style={{ width: '100%' }}
        />
      );
    }
    case 'timeRange': {
      const range = Array.isArray(value) ? (value as [string, string]) : [null, null];
      return (
        <Space.Compact>
          <TimePicker
            placeholder={t('起')}
            value={range[0] ? dayjs(range[0], 'HH:mm:ss') : null}
            onChange={(d) => onChange([d ? d.format('HH:mm:ss') : null, range[1]])}
            style={{ width: '100%' }}
          />
          <TimePicker
            placeholder={t('止')}
            value={range[1] ? dayjs(range[1], 'HH:mm:ss') : null}
            onChange={(d) => onChange([range[0], d ? d.format('HH:mm:ss') : null])}
            style={{ width: '100%' }}
          />
        </Space.Compact>
      );
    }
    case 'lov':
      return (
        <LovSelect
          lovCode={meta.lovCode}
          dataSource={meta.dataSource}
          placeholder={t('请选择{{label}}', { label })}
          value={value as string}
          onChange={onChange}
        />
      );
    case 'lovMulti':
      return (
        <LovSelect
          lovCode={meta.lovCode}
          dataSource={meta.dataSource}
          multiple
          placeholder={t('请选择{{label}}', { label })}
          value={value as string[]}
          onChange={onChange}
        />
      );
    case 'areaCascader':
      // 省市区级联选择：层级由后端 ItemType 后缀（area1~4）推导，值提交最后选中的地区编号
      return (
        <AreaCascader
          maxLevel={resolveAreaMaxLevel(meta)}
          value={typeof value === 'number' ? value : value != null && value !== '' ? Number(value) : undefined}
          onChange={(v) => onChange(v)}
        />
      );
    case 'switch':
      return (
        <Select
          allowClear
          placeholder={t('全部')}
          value={value == null ? undefined : value === true || value === 'true' ? '1' : '0'}
          onChange={(v) => onChange(v == null ? undefined : v === '1')}
          options={[
            { value: '1', label: t('是') },
            { value: '0', label: t('否') },
          ]}
          style={{ width: '100%' }}
        />
      );
    case 'fileExists':
      return (
        <Select
          allowClear
          placeholder={t('全部')}
          value={value == null ? undefined : value === true || value === '1' ? '1' : '0'}
          onChange={(v) => onChange(v == null ? undefined : v === '1')}
          options={[
            { value: '1', label: t('有附件') },
            { value: '0', label: t('无附件') },
          ]}
          style={{ width: '100%' }}
        />
      );
    default:
      return (
        <FocusClearInput
          showClear={inputClear}
          placeholder={placeholder}
          value={(value as string) ?? ''}
          onChange={(e) => onChange(e.target.value || undefined)}
        />
      );
  }
}

/** 搜索字段分组：keyword 关键字、range 区间、normals 普通条件 */
export interface SearchFieldGroups {
  /** 关键字查询项（kind=keyword，占搜索条首格） */
  keyword?: FieldMapping;
  /** 区间查询项（kind=range，提交 name/end 两参） */
  ranges: FieldMapping[];
  /** 普通查询项 */
  normals: FieldMapping[];
}

/**
 * 按 /meta 的 `kind` 拆分搜索项（页面呈现架构 §4.3）
 *
 * @param fields 搜索字段元数据
 * @returns 关键字 / 区间 / 普通三组，组内保持原顺序
 */
export function splitSearchFields(fields: FieldMapping[]): SearchFieldGroups {
  const groups: SearchFieldGroups = { ranges: [], normals: [] };
  for (const fm of fields) {
    const kind = toFieldMeta(fm.field).kind;
    if (kind === 'keyword') groups.keyword = fm;
    else if (kind === 'range') groups.ranges.push(fm);
    else groups.normals.push(fm);
  }
  return groups;
}

/** 区间项控件：时间类用日期时间区间，其余用数值区间 */
function resolveRangeControl(meta: FieldMeta): SearchControlType {
  return meta.typeName === 'DateTime' ? 'datetimeRange' : 'numberRange';
}

/** 待渲染的搜索单元格 */
interface SearchCell {
  fm: FieldMapping;
  wide: boolean;
  range: boolean;
}

export default function SearchBar({ fields, onSearch, onReset, initialValues, extra }: SearchBarProps) {
  const [formData, setFormData] = useState<Record<string, unknown>>({});
  const [expanded, setExpanded] = useState(false);
  const [visibleCount, setVisibleCount] = useState(0);
  const gridRef = useRef<HTMLDivElement>(null);
  const actionsRef = useRef<HTMLDivElement>(null);

  // 单元格顺序：关键字首格 → 普通条件 → 区间条件（区间占 2 格）
  const cells = useMemo<SearchCell[]>(() => {
    const groups = splitSearchFields(fields);
    const list: SearchCell[] = [];
    if (groups.keyword) list.push({ fm: groups.keyword, wide: false, range: false });
    for (const fm of groups.normals) {
      const control = resolveSearchControl(toFieldMeta(fm.field));
      list.push({ fm, wide: isRangeControl(control), range: false });
    }
    for (const fm of groups.ranges) list.push({ fm, wide: true, range: true });
    return list;
  }, [fields]);

  // 字段变化时重置；外部 URL 参数（initialValues）优先回显
  useEffect(() => {
    setFormData(initialValues && Object.keys(initialValues).length ? { ...initialValues } : {});
    setExpanded(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fields]);

  // 外部 URL 查询参数变化（如工作台指标卡再次跳转）：回填表单值
  useEffect(() => {
    if (!initialValues || Object.keys(initialValues).length === 0) return;
    setFormData({ ...initialValues });
  }, [initialValues]);

  // 折叠可见数：按容器宽度估算列数，折叠时最多显示 MAX_ROWS 行（区间控件占 2 格）
  useEffect(() => {
    const el = gridRef.current;
    if (!el) return;

    const calc = () => {
      const width = el.clientWidth;
      // 预留操作按钮区宽度，让「搜索/重置/展开」尽量留在最后一行右侧
      const actionsWidth = actionsRef.current?.offsetWidth ?? 0;
      const cols = Math.max(1, Math.floor((width - actionsWidth) / MIN_CELL));
      let used = 0;
      let count = 0;
      for (const c of cells) {
        const need = cols > 1 && c.wide ? 2 : 1;
        if (used + need > cols * MAX_ROWS) break;
        used += need;
        count++;
      }
      setVisibleCount(count);
    };

    calc();
    if (typeof ResizeObserver !== 'undefined') {
      const ro = new ResizeObserver(calc);
      ro.observe(el);
      return () => ro.disconnect();
    }
    return undefined;
  }, [fields]);

  const setValue = (key: string, value: unknown) => {
    setFormData((prev) => ({ ...prev, [key]: value }));
  };

  const handleSearch = () => {
    // 清理空值；区间项拆成 name/end 两参（如 dtStart/dtEnd），其余按控件类型归一
    const params: Record<string, unknown> = {};
    for (const c of cells) {
      const name = c.fm.field.name;
      const v = formData[name];

      if (c.range) {
        if (!Array.isArray(v)) continue;
        const [start, end] = v as unknown[];
        if (start !== null && start !== undefined && start !== '') params[name] = start;
        const endKey = c.fm.field.end || `${name}End`;
        if (end !== null && end !== undefined && end !== '') params[endKey] = end;
        continue;
      }
      if (v === '' || v === null || v === undefined) continue;
      if (Array.isArray(v)) {
        const nonNull = (v as unknown[]).filter((x) => x !== null && x !== undefined);
        if (!nonNull.length) continue;
        // lovMulti 多选（角色/部门等）：逗号分隔字符串，如 roleID=1,2；范围类保持数组
        const control = resolveSearchControl(toFieldMeta(c.fm.field));
        params[name] = control === 'lovMulti' ? nonNull.join(',') : nonNull;
        continue;
      }
      params[name] = v;
    }
    onSearch(params);
  };

  const handleReset = () => {
    setFormData({});
    onReset();
  };

  if (!cells.length) return null;

  // 存在已填/回显条件时自动展开，避免条件被折叠隐藏（如工作台指标卡跳转携带 dtStart/success=false）
  const hasFilled = Object.keys(formData).some(
    (k) => formData[k] != null && formData[k] !== '' && !(Array.isArray(formData[k]) && (formData[k] as unknown[]).length === 0),
  );
  const visibleCells = expanded || hasFilled ? cells : cells.slice(0, visibleCount);
  const canCollapse = cells.length > visibleCount;

  return (
    <div className="cube-search-panel">
      <div ref={gridRef} className="cube-search-fields">
        {visibleCells.map((c) => {
          const meta = toFieldMeta(c.fm.field);
          const control = c.range ? resolveRangeControl(meta) : resolveSearchControl(meta);
          return (
            <div
              key={meta.name}
              className={c.wide ? 'cube-search-item cube-search-item--wide' : 'cube-search-item'}
            >
              <span className="cube-search-label">{meta.displayName || meta.name}</span>
              <div className="cube-search-control">
                <SearchControl
                  field={c.fm}
                  control={control}
                  value={formData[meta.name]}
                  onChange={(v) => setValue(meta.name, v)}
                />
              </div>
            </div>
          );
        })}
        {/* 操作按钮与条件同行，落在最后一行右侧；行满时自动换行并靠右对齐 */}
        <div ref={actionsRef} className="cube-search-actions">
          <Button type="primary" onClick={handleSearch}>
            {t('搜索')}
          </Button>
          <Button onClick={handleReset}>{t('重置')}</Button>
          {canCollapse && (
            <Button type="link" size="small" onClick={() => setExpanded((v) => !v)}>
              {expanded ? (
                <>
                  {t('收起')} <UpOutlined />
                </>
              ) : (
                <>
                  {t('展开')} <DownOutlined />
                </>
              )}
            </Button>
          )}
          {/* 页面扩展插槽（META-6）：业务自定义搜索区域追加在按钮右侧 */}
          {extra}
        </div>
      </div>
    </div>
  );
}
