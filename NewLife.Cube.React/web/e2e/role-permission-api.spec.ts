/**
 * 角色权限 API 级集成测试（无 UI，验证 上传写入数据库 → 重新读取 的真实 HTTP 往返）
 *
 * 与 UI E2E（role-permission.spec.ts）互补：绕过界面直接调后端接口，
 * 验证 SavePermission 保存（含 All=-1 级联串、额外权限位 16）、PermissionTree 读回 granted 一致。
 *
 * 测试角色 e2e-api-{ts}-role 用完即删，数据隔离。
 */
import { expect, test, type APIRequestContext } from '@playwright/test';
import { ALT_PASS, ALT_USER } from './utils/env';

const PREFIX = `e2e-api-${Date.now()}`;
// 单会话策略：本套件会重新登录多次，用副账号避免吊销共享 storageState 的主账号令牌
const ADMIN_USER = ALT_USER;
const ADMIN_PASS = ALT_PASS;

/** 登录并返回授权头 */
async function loginHeaders(request: APIRequestContext): Promise<Record<string, string>> {
  const res = await request.post('/Auth/Login', {
    data: { username: ADMIN_USER, password: ADMIN_PASS, remember: true },
  });
  expect(res.ok()).toBeTruthy();
  const body = await res.json();
  expect(body.code, `登录失败: ${body.message}`).toBe(0);
  return { Authorization: `Bearer ${body.data.access_token}` };
}

/** 权限树节点 */
type PermissionNode = { id: number; granted?: number; children?: unknown[] };

/** 在权限树中递归查找节点 */
function findNode(nodes: PermissionNode[] | undefined, id: number): PermissionNode | null {
  if (!nodes) return null;
  for (const n of nodes) {
    if (n.id === id) return n;
    const hit: PermissionNode | null = findNode(n.children as PermissionNode[], id);
    if (hit) return hit;
  }
  return null;
}

test.describe('角色权限 API 集成（/Admin/Role）', () => {
  test('SavePermission 写入数据库后 PermissionTree 重新读取 granted 一致', async ({ request }) => {
    const headers = await loginHeaders(request);

    // 1. 创建测试角色（实体 API）
    const name = `${PREFIX}-role`;
    const create = await request.post('/api/Admin/Role', { headers, data: { name, enable: true } });
    expect(create.ok(), `创建角色失败: ${await create.text()}`).toBeTruthy();
    const createBody = await create.json();
    expect(createBody.code).toBe(0);
    const roleId = createBody.data?.id ?? createBody.data?.ID;
    expect(roleId, '创建角色未返回 id').toBeTruthy();

    try {
      // 2. 保存权限串：系统管理(25)=全部(-1)、首页(32)=查看+释放内存(17)、用户(47)=查看(1)
      // 模拟前端「全部」级联（-1）与额外权限位场景
      const perm = '25#-1,32#17,47#1';
      const save = await request.post('/api/Admin/Role/SavePermission', { headers, data: { roleId, permission: perm } });
      expect(save.ok(), `保存权限失败: ${await save.text()}`).toBeTruthy();
      const saveBody = await save.json();
      expect(saveBody.code, `保存权限业务失败: ${saveBody.message}`).toBe(0);

      // 3. 重新读取权限树，验证 granted 与提交一致（数据库往返）
      const tree = await request.get('/api/Admin/Role/PermissionTree', { headers, params: { roleId } });
      expect(tree.ok()).toBeTruthy();
      const treeBody = await tree.json();
      expect(treeBody.code).toBe(0);

      const n25 = findNode(treeBody.data.tree, 25);
      const n32 = findNode(treeBody.data.tree, 32);
      const n47 = findNode(treeBody.data.tree, 47);
      expect(n25, '系统管理(25) 不在权限树').not.toBeNull();
      expect(n32, '首页(32) 不在权限树').not.toBeNull();
      expect(n47, '用户(47) 不在权限树').not.toBeNull();

      // All=0xFFFFFFFF 读回为 4294967295（UInt32 JSON 序列化）
      expect(n25!.granted).toBe(4294967295);
      // 额外权限位：查看(1)+释放内存(16)=17
      expect(n32!.granted).toBe(17);
      expect(n47!.granted).toBe(1);
    } finally {
      // 4. 清理：删除测试角色（DELETE /api/Admin/Role/{id}）
      const del = await request.delete(`/api/Admin/Role/${roleId}`, { headers });
      expect(del.ok(), `删除角色失败: ${await del.text()}`).toBeTruthy();
    }
  });

  test('清空权限串后 PermissionTree 读回全部无权限', async ({ request }) => {
    const headers = await loginHeaders(request);

    const name = `${PREFIX}-clear`;
    const create = await request.post('/api/Admin/Role', { headers, data: { name, enable: true } });
    const createBody = await create.json();
    const roleId = createBody.data?.id ?? createBody.data?.ID;

    try {
      // 先授予，再清空
      await request.post('/api/Admin/Role/SavePermission', { headers, data: { roleId, permission: '25#-1,32#17' } });
      const clear = await request.post('/api/Admin/Role/SavePermission', { headers, data: { roleId, permission: '' } });
      expect(clear.ok()).toBeTruthy();
      const clearBody = await clear.json();
      expect(clearBody.code).toBe(0);

      const tree = await request.get('/api/Admin/Role/PermissionTree', { headers, params: { roleId } });
      const treeBody = await tree.json();
      expect(treeBody.code).toBe(0);
      const n25 = findNode(treeBody.data.tree, 25);
      const n32 = findNode(treeBody.data.tree, 32);
      expect(n25!.granted).toBe(0);
      expect(n32!.granted).toBe(0);
    } finally {
      await request.delete(`/api/Admin/Role/${roleId}`, { headers });
    }
  });
});
