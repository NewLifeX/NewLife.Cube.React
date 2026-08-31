/**
 * 聚焦清除输入框（对齐主流表单交互）
 *
 * antd Input 的 allowClear 只要有内容就常显清除图标；本组件改为：
 * 聚焦且有内容时显示清除图标，失焦时消失（由 React 皮肤设置 inputClear 控制是否启用）。
 *
 * 应用于表单字段控件 / 搜索框 / 导航搜索等文本输入。
 */
import { useState } from 'react';
import { Input } from 'antd';
import type { InputProps } from 'antd';
import { CloseCircleFilled } from '@ant-design/icons';

export interface FocusClearInputProps extends InputProps {
  /** 是否启用聚焦清除（对应 React 设置 inputClear：false 则永不显示清除图标） */
  showClear: boolean;
}

export default function FocusClearInput({
  showClear,
  value,
  onChange,
  onFocus,
  onBlur,
  ...rest
}: FocusClearInputProps) {
  const [focused, setFocused] = useState(false);
  const hasValue = value != null && value !== '';

  return (
    <Input
      {...rest}
      value={value}
      onChange={onChange}
      onFocus={(e) => {
        setFocused(true);
        onFocus?.(e);
      }}
      onBlur={(e) => {
        setFocused(false);
        onBlur?.(e);
      }}
      suffix={
        showClear && focused && hasValue ? (
          <CloseCircleFilled
            className="cube-input-clear"
            // 阻止 mousedown 默认行为，避免点击清除前先触发 blur 导致图标消失
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => onChange?.({ target: { value: '' } } as React.ChangeEvent<HTMLInputElement>)}
          />
        ) : null
      }
    />
  );
}
