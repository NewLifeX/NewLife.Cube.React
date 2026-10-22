/**
 * URL/取值工具单元测试
 */
import { describe, expect, it } from 'vitest';
import {
  toPascalCase,
  toCamelCase,
  toPascalAndCamel,
  routeToApiPrefix,
  getValueByKey,
  setValueByKey,
  resolveUrl,
  parseUrlQuery,
} from '@/utils/url';

describe('toPascalCase / toCamelCase', () => {
  it('基本转换', () => {
    expect(toPascalCase('device-profile')).toBe('DeviceProfile');
    expect(toPascalCase('user')).toBe('User');
    expect(toCamelCase('User_Name')).toBe('userName');
    expect(toCamelCase('UserName')).toBe('userName');
  });
});

describe('routeToApiPrefix', () => {
  it('路由转 API 前缀（带前导斜杠）', () => {
    expect(routeToApiPrefix('/admin/user')).toBe('/Admin/User');
    expect(routeToApiPrefix('/device/device-profile')).toBe('/Device/DeviceProfile');
    expect(routeToApiPrefix('/')).toBe('/');
  });
});

describe('getValueByKey 大小写不敏感', () => {
  const row = { id: 1, Name: '张三', mobile: '138' };

  it('直接命中', () => {
    expect(getValueByKey(row, 'Name')).toBe('张三');
    expect(getValueByKey(row, 'id')).toBe(1);
  });

  it('Pascal ↔ camel 翻转', () => {
    expect(getValueByKey(row, 'name')).toBe('张三');
    expect(getValueByKey(row, 'Mobile')).toBe('138');
  });

  it('全大写/全小写回退', () => {
    const row2 = { ID: 5, uuid: 'x' };
    expect(getValueByKey(row2, 'id')).toBe(5);
    expect(getValueByKey(row2, 'UUID')).toBe('x');
  });

  it('多字符大小写差异（注入的扩展字段键保持原大小写）', () => {
    // 后端注入的 IExtend.Items 键为 PascalCase（AvatarImage），行 JSON 其余为 camelCase
    const injected = { id: 1, avatarImage: '/Sso/Avatar?id=1', AvatarImage: '/Sso/Avatar?id=1' };
    expect(getValueByKey(injected, 'AvatarImage')).toBe('/Sso/Avatar?id=1');
    expect(getValueByKey(injected, 'avatarImage')).toBe('/Sso/Avatar?id=1');
    expect(getValueByKey(injected, 'AVATARIMAGE')).toBe('/Sso/Avatar?id=1');
    // 大小写任意组合均可命中
    expect(getValueByKey({ roleid: '1' }, 'RoleId')).toBe('1');
    expect(getValueByKey({ DisplayName: '张三' }, 'displayname')).toBe('张三');
  });

  it('不存在返回 undefined', () => {
    expect(getValueByKey(row, 'Nope')).toBeUndefined();
  });
});

describe('setValueByKey 大小写不敏感写入', () => {
  it('不存在时新增', () => {
    const data: Record<string, unknown> = {};
    setValueByKey(data, 'name', 1);
    expect(data).toEqual({ name: 1 });
  });

  it('已存在同键（忽略大小写）时覆盖原键', () => {
    const data = { name: 1 };
    setValueByKey(data, 'Name', 2);
    expect(data).toEqual({ name: 2 });

    const data2 = { Name: 1 };
    setValueByKey(data2, 'name', 2);
    expect(data2).toEqual({ Name: 2 });
  });

  it('精确键优先', () => {
    const data = { Name: 1, name: 2 };
    setValueByKey(data, 'Name', 3);
    expect(data).toEqual({ Name: 3, name: 2 });
  });
});

describe('resolveUrl 变量替换', () => {
  it('替换 {Id} 模板', () => {
    expect(resolveUrl('/Admin/User/{Id}', { Id: 42 })).toBe('/Admin/User/42');
    expect(resolveUrl('/Admin/User/{id}', { id: 7 })).toBe('/Admin/User/7');
  });

  it('占位符与行键大小写不一致时仍可替换', () => {
    // 行 JSON camelCase，模板占位符 PascalCase
    expect(resolveUrl('/Admin/User/{Id}', { id: 42 })).toBe('/Admin/User/42');
    expect(resolveUrl('/Admin/UserConnect?userId={ID}', { id: 7 })).toBe('/Admin/UserConnect?userId=7');
  });
});

describe('parseUrlQuery 解析 URL 查询串', () => {
  it('带 ? 前缀解析键值', () => {
    expect(parseUrlQuery('?dtStart=2026-08-01&success=false')).toEqual({
      dtStart: '2026-08-01',
      success: 'false',
    });
  });

  it('不带 ? 也可解析，空值忽略', () => {
    expect(parseUrlQuery('dtStart=2026-08-01&empty=&x=1')).toEqual({ dtStart: '2026-08-01', x: '1' });
  });

  it('无参数返回空对象', () => {
    expect(parseUrlQuery('')).toEqual({});
    expect(parseUrlQuery('?')).toEqual({});
  });
});
