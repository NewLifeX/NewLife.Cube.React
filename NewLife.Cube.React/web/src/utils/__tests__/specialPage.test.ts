/**
 * 特殊页路径判定单元测试
 */
import { describe, expect, it } from 'vitest';
import { isSpecialApiPath } from '@/utils/specialPage';

describe('isSpecialApiPath', () => {
  it('已知特殊页命中（服务器信息/数据库/部件/视图诊断）', () => {
    expect(isSpecialApiPath('/Admin/Index/Main')).toBe(true);
    expect(isSpecialApiPath('/Admin/Db')).toBe(true);
    expect(isSpecialApiPath('/Cube/Widget')).toBe(true);
    expect(isSpecialApiPath('/Widget')).toBe(true);
    expect(isSpecialApiPath('/Cube/ViewTrace')).toBe(true);
    expect(isSpecialApiPath('/ViewTrace')).toBe(true);
  });

  it('大小写不敏感', () => {
    expect(isSpecialApiPath('/cube/widget')).toBe(true);
    expect(isSpecialApiPath('/ADMIN/DB')).toBe(true);
  });

  it('普通实体页不命中', () => {
    expect(isSpecialApiPath('/Admin/User')).toBe(false);
    expect(isSpecialApiPath('/Admin/Log')).toBe(false);
    expect(isSpecialApiPath('/Cube/App')).toBe(false);
    // 仅后缀匹配，避免 /Admin/DbBackup 之类误判
    expect(isSpecialApiPath('/Admin/DbBackup')).toBe(false);
  });

  it('空路径不命中', () => {
    expect(isSpecialApiPath('')).toBe(false);
  });
});
