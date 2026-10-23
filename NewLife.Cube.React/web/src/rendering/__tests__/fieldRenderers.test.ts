/**
 * 字段级渲染器注册表单元测试（META-4）
 */
import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  clearFieldRenderers,
  getFieldRenderer,
  registerFieldRenderer,
} from '../fieldRenderers';

/** 空渲染组件 */
function Dummy() {
  return null;
}

describe('fieldRenderers 注册表', () => {
  afterEach(() => clearFieldRenderers());

  it('注册后可按 view 名取回，同名后注册覆盖', () => {
    registerFieldRenderer('orgPicker', { component: Dummy });
    expect(getFieldRenderer('orgPicker')?.component).toBe(Dummy);

    const Second = () => null;
    registerFieldRenderer('orgPicker', { component: Second });
    expect(getFieldRenderer('orgPicker')?.component).toBe(Second);
  });

  it('未注册返回 undefined 且只告警一次（降级内置控件）', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    expect(getFieldRenderer('unknown')).toBeUndefined();
    expect(getFieldRenderer('unknown')).toBeUndefined();
    expect(warn).toHaveBeenCalledTimes(1);
    warn.mockRestore();
  });

  it('未声明 view 时静默返回 undefined', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    expect(getFieldRenderer(undefined)).toBeUndefined();
    expect(getFieldRenderer('')).toBeUndefined();
    expect(warn).not.toHaveBeenCalled();
    warn.mockRestore();
  });
});
