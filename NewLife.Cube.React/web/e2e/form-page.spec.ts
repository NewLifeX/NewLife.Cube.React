/**
 * 整页表单 E2E（FORM-5）
 *
 * 覆盖：`/Edit?id=主键` 深度链接渲染整页表单（非列表）、详情回填、修改保存落库。
 * 用户由用例自建自删，不依赖演示库预置数据。
 */
import { expect, test } from '@playwright/test';

/** 通过 API 创建用户并返回主键（页面内置登录态） */
async function createUser(page: import('@playwright/test').Page, name: string): Promise<number> {
  return page.evaluate(async (userName) => {
    const token = localStorage.getItem('token') || '';
    const res = await fetch('/api/Admin/User', {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ Name: userName }),
    });
    const body = await res.json();
    if (body.code !== 0) throw new Error(body.message || '创建用户失败');
    return body.data.id as number;
  }, name);
}

/** 删除用户（清理测试数据） */
async function deleteUser(page: import('@playwright/test').Page, id: number): Promise<void> {
  await page.evaluate(async (userId) => {
    const token = localStorage.getItem('token') || '';
    await fetch(`/api/Admin/User/${userId}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` },
    });
  }, id);
}

test.describe('整页表单（/Edit?id=）', () => {
  test('加载详情回填、修改昵称并保存落库', async ({ page }) => {
    await page.goto('/Admin/User');
    await expect(page.locator('.ant-table-tbody tr.ant-table-row').first()).toBeVisible({ timeout: 15000 });

    const name = `e2e-form-${Date.now()}`;
    const id = await createUser(page, name);
    try {
      await page.goto(`/Admin/User/Edit?id=${id}`);

      // 整页表单：卡片标题 + 保存按钮，无列表表格
      await expect(page.locator('.cube-entity-card')).toBeVisible({ timeout: 15000 });
      await expect(page.getByRole('button', { name: /保\s*存/ })).toBeVisible();
      await expect(page.locator('.ant-table')).toHaveCount(0);

      // 详情回填：首个输入框为登录名
      await expect(page.locator('.cube-entity-card input').first()).toHaveValue(name, { timeout: 15000 });

      // 修改昵称并保存
      const display = `改名-${name}`;
      await page
        .locator('.cube-form-inline-cell', { hasText: '昵称' })
        .first()
        .locator('input')
        .fill(display);
      await page.getByRole('button', { name: /保\s*存/ }).click();
      // 保存成功后返回上一页（整页表单为浏览器历史回退）
      await page.waitForURL(/\/Admin\/User$/, { timeout: 15000 });

      // 后端落库校验
      const saved = await page.evaluate(async (userId) => {
        const token = localStorage.getItem('token') || '';
        const res = await fetch(`/api/Admin/User/${userId}`, { headers: { Authorization: `Bearer ${token}` } });
        return (await res.json()).data.displayName as string;
      }, id);
      expect(saved).toBe(display);
    } finally {
      await deleteUser(page, id);
    }
  });
});
