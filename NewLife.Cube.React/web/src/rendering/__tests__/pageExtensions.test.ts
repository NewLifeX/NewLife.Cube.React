/**
 * 页面扩展点注册表单元测试（META-6 M2 混合页）
 */
import { afterEach, describe, expect, it } from 'vitest';
import {
  clearPageExtensions,
  getPageExtension,
  registerPageExtension,
} from '../pageExtensions';

describe('pageExtensions 页面扩展点注册表', () => {
  afterEach(() => clearPageExtensions());

  it('按路径注册并可读取（大小写不敏感）', () => {
    registerPageExtension('Admin/User', { toolbarExtra: () => 'extra' });
    expect(getPageExtension('Admin/User')).not.toBeNull();
    expect(getPageExtension('admin/user')).not.toBeNull();
  });

  it('未注册路径与空参数返回 null', () => {
    expect(getPageExtension('Admin/None')).toBeNull();
    expect(getPageExtension('')).toBeNull();
    expect(getPageExtension(null)).toBeNull();
  });

  it('同一路径后注册覆盖先注册', () => {
    registerPageExtension('Admin/User', { toolbarExtra: () => 'first' });
    registerPageExtension('ADMIN/USER', { toolbarExtra: () => 'second' });
    const ext = getPageExtension('Admin/User');
    expect(ext?.toolbarExtra?.({ type: 'Admin/User', query: {}, selectedKeys: [], reload: () => {} })).toBe('second');
  });

  it('清空注册表后读取为空', () => {
    registerPageExtension('Admin/User', {});
    clearPageExtensions();
    expect(getPageExtension('Admin/User')).toBeNull();
  });
});
