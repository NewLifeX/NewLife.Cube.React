/**
 * 权限串解析与位测试单元测试（META-3）
 *
 * 覆盖共享包 `@newlifex/cube` 导出的纯函数：`parsePermissionString` / `hasPermissionAction`。
 * 契约来源：服务端 `UserInfo.permission` 为 `menuId#flag,menuId#flag`，`-1` 等价 All。
 */
import { describe, expect, it } from 'vitest';
import { hasPermissionAction, parsePermissionString, PermissionFlags } from '@newlifex/cube';

describe('parsePermissionString', () => {
  it('解析标准串为 menuId → 权限位', () => {
    const map = parsePermissionString('1#3,2#8');
    expect(map.get(1)).toBe(3);
    expect(map.get(2)).toBe(8);
  });

  it('空串与未定义返回空集合', () => {
    expect(parsePermissionString(undefined).size).toBe(0);
    expect(parsePermissionString('').size).toBe(0);
    expect(parsePermissionString(null).size).toBe(0);
  });

  it('跳过非法项（缺 #、非数字、空段）', () => {
    const map = parsePermissionString('1#2, bad, 3#, #4, 5#x');
    expect(map.get(1)).toBe(2);
    expect(map.size).toBe(1);
  });

  it('-1 表示全部权限', () => {
    const map = parsePermissionString('7#-1');
    expect(map.get(7)).toBe(-1);
  });
});

describe('hasPermissionAction', () => {
  const map = parsePermissionString('12#6'); // 12 号菜单：Insert(2) + Update(4)

  it('位包含时返回 true', () => {
    expect(hasPermissionAction(map, 12, PermissionFlags.Insert)).toBe(true);
    expect(hasPermissionAction(map, 12, PermissionFlags.Update)).toBe(true);
  });

  it('位不包含返回 false', () => {
    expect(hasPermissionAction(map, 12, PermissionFlags.Delete)).toBe(false);
  });

  it('菜单无权限项返回 false（fail-closed）', () => {
    expect(hasPermissionAction(map, 99, PermissionFlags.Detail)).toBe(false);
  });

  it('缺少 menuId 或 flag 时返回 null（交给旧口径回退）', () => {
    expect(hasPermissionAction(map, undefined, PermissionFlags.Detail)).toBeNull();
    expect(hasPermissionAction(map, 12, undefined)).toBeNull();
  });

  it('All(-1) 命中任意位', () => {
    const all = parsePermissionString('5#-1');
    expect(hasPermissionAction(all, 5, PermissionFlags.Delete)).toBe(true);
    expect(hasPermissionAction(all, 5, 0x10)).toBe(true);
  });
});
