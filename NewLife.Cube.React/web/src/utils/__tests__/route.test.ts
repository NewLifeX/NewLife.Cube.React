/**
 * 表单路径判定单测
 */
import { describe, expect, it } from 'vitest';
import { isFormPath } from '../route';

describe('isFormPath', () => {
  it('独立 id 参数按表单页处理', () => {
    expect(isFormPath('/Admin/User/Edit', '?id=1')).toBe(true);
    expect(isFormPath('/Admin/User', '?id=1')).toBe(true);
  });

  it('userId 等包含 id 子串的参数不能误判为表单页', () => {
    expect(isFormPath('/Admin/UserToken', '?userId=1')).toBe(false);
    expect(isFormPath('/Admin/UserConnect', '?userId=1&provider=Github')).toBe(false);
    expect(isFormPath('/Admin/User', '?foo=id=1')).toBe(false);
  });

  it('路径后缀按表单页处理', () => {
    expect(isFormPath('/Admin/User/Edit', '')).toBe(true);
    expect(isFormPath('/Admin/User/Add', '')).toBe(true);
    expect(isFormPath('/Admin/User/New', '')).toBe(true);
    expect(isFormPath('/Admin/User/Detail', '')).toBe(true);
    expect(isFormPath('/Admin/User/Detail/1', '')).toBe(false);
  });

  it('空 id 不视为编辑模式', () => {
    expect(isFormPath('/Admin/User', '?id=')).toBe(false);
  });
});
