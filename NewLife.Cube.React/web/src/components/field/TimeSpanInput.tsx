/**
 * 时长输入（ItemType=TimeSpan）
 *
 * 后端 `ItemType=TimeSpan` 的字段仍是整数（秒/毫秒/分钟/小时，单位由描述推断），
 * 直接给数字框让人填「22515」既不直观也容易填错，这里拆成「时 : 分 : 秒」三段输入，
 * 对外仍只暴露原始存储值（与 Vue/NaiveUI/MUI 等皮肤同一口径）。
 */
import { useEffect, useRef, useState } from 'react';
import { InputNumber } from 'antd';
import {
  joinTimeSpan,
  splitTimeSpan,
  timeSpanUnitOfDescription,
  type TimeSpanParts,
  type TimeSpanUnit,
} from '@/utils/timeSpan';

export interface TimeSpanInputProps {
  /** 存储值（秒 / 毫秒 / 分钟 / 小时，取决于单位） */
  value?: unknown;
  /** 值变更回调，参数为原始存储值 */
  onChange?: (value: number) => void;
  /** 显式指定存储单位；缺省按 description 推断 */
  unit?: TimeSpanUnit;
  /** 字段描述，用于推断存储单位 */
  description?: string;
  /** 是否禁用 */
  disabled?: boolean;
}

const PARTS: { key: keyof TimeSpanParts; hint: string; max?: number }[] = [
  { key: 'hours', hint: '时' },
  { key: 'minutes', hint: '分', max: 59 },
  { key: 'seconds', hint: '秒', max: 59 },
];

export default function TimeSpanInput({ value, onChange, unit, description, disabled }: TimeSpanInputProps) {
  const resolvedUnit = unit ?? timeSpanUnitOfDescription(description);
  const [parts, setParts] = useState<TimeSpanParts>(() => splitTimeSpan(value, resolvedUnit));
  const lastValue = useRef<unknown>(value);

  // 外部值变化（编辑回填 / 表单重置）时重新拆分；自身回写引起的同值变化直接跳过
  useEffect(() => {
    if (lastValue.current === value) return;
    lastValue.current = value;
    setParts(splitTimeSpan(value, resolvedUnit));
  }, [value, resolvedUnit]);

  const update = (key: keyof TimeSpanParts, v: number | null) => {
    const next = { ...parts, [key]: Number(v ?? 0) || 0 };
    setParts(next);
    const joined = joinTimeSpan(next, resolvedUnit);
    lastValue.current = joined;
    onChange?.(joined);
  };

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 6, width: '100%' }}>
      {PARTS.map((part) => (
        <InputNumber
          key={part.key}
          disabled={disabled}
          min={0}
          max={part.max}
          precision={part.key === 'seconds' && resolvedUnit === 'milliseconds' ? 3 : 0}
          step={part.key === 'seconds' && resolvedUnit === 'milliseconds' ? 0.001 : 1}
          value={parts[part.key]}
          onChange={(v) => update(part.key, v)}
          placeholder={part.hint}
          aria-label={part.hint}
          style={{ flex: 1 }}
        />
      ))}
    </div>
  );
}
