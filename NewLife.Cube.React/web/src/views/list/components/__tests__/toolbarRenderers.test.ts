/**
 * 工具栏自定义按钮渲染器注册表单元测试（LIST-14 / META-4 相关）
 */
import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  clearToolbarRenderers,
  getToolbarRenderer,
  registerToolbarRenderer,
} from '../toolbarRenderers';

/** 空组件 */
function Dummy() {
  return null;
}

describe('toolbarRenderers 注册表', () => {
  afterEach(() => clearToolbarRenderers());

  it('注册后可按名称取回，同名后注册覆盖', () => {
    registerToolbarRenderer('advancedImport', { component: Dummy });
    expect(getToolbarRenderer('advancedImport')?.component).toBe(Dummy);

    const Second = () => null;
    registerToolbarRenderer('advancedImport', { component: Second });
    expect(getToolbarRenderer('advancedImport')?.component).toBe(Second);
  });

  it('未注册返回 undefined 且只告警一次', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    expect(getToolbarRenderer('missing')).toBeUndefined();
    expect(getToolbarRenderer('missing')).toBeUndefined();
    expect(warn).toHaveBeenCalledTimes(1);
    warn.mockRestore();
  });

  it('名称为空返回 undefined', () => {
    expect(getToolbarRenderer(undefined)).toBeUndefined();
    expect(getToolbarRenderer('')).toBeUndefined();
  });
});
