/**
 * LOV 值集选择组件（单选 / 多选）
 *
 * 选项来源优先级：dataSource（数据字典）→ lovCode（Meta/ListData 接口）。
 * 多选提交时由 serializeSubmitModel 统一转为逗号分隔字符串。
 */
import { Select } from 'antd';
import { useLovOptions, type LovOption } from '@/hooks/useLovOptions';

export interface LovSelectProps {
  value?: string | string[] | number | number[] | null;
  onChange?: (value: string | string[] | undefined) => void;
  lovCode?: string;
  dataSource?: Record<string, string>;
  multiple?: boolean;
  /** 级联父字段当前值：子字典选项按 parent 过滤（无 parent 信息的选项保留） */
  parent?: unknown;
  placeholder?: string;
  disabled?: boolean;
  allowClear?: boolean;
  style?: React.CSSProperties;
}

/**
 * 按父级值过滤枚举子字典选项（呈现架构 §4.5 parentField）
 *
 * 无父值或选项未声明 parent 时不过滤（兼容普通枚举与列表型值集）。
 *
 * @param options 选项
 * @param parent 父字段当前值
 * @returns 过滤后的选项
 */
export function filterLovOptions(options: LovOption[], parent?: unknown): LovOption[] {
  if (parent === null || parent === undefined || parent === '') return options;
  const target = String(parent);
  return options.filter((o) => o.parent === null || o.parent === undefined || String(o.parent) === target);
}

export default function LovSelect({
  value,
  onChange,
  lovCode,
  dataSource,
  multiple = false,
  parent,
  placeholder,
  disabled,
  allowClear = true,
  style,
}: LovSelectProps) {
  const { options, loading } = useLovOptions(lovCode, dataSource);
  const visibleOptions = filterLovOptions(options, parent);

  // 后端 value 可能是数字，统一转字符串比较；展示时保持原值
  const normalized = Array.isArray(value)
    ? value.map((v) => String(v))
    : value != null
      ? String(value)
      : undefined;

  return (
    <Select
      mode={multiple ? 'multiple' : undefined}
      value={normalized}
      onChange={(val) => onChange?.(val as string | string[] | undefined)}
      options={visibleOptions}
      loading={loading}
      placeholder={placeholder}
      disabled={disabled}
      allowClear={allowClear}
      showSearch
      optionFilterProp="label"
      style={{ width: '100%', ...style }}
    />
  );
}
