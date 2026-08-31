/**
 * 视图解析诊断页 E2E（/Cube/ViewTrace）
 *
 * 覆盖：页面加载显示表单与候选路径表格、输入控制器解析后渲染候选路径与命中标记。
 * 仅开发模式 + 系统管理员可用（SysConfig.Develop + IsSystem 角色）。
 */
import { expect, test } from '@playwright/test';

test.describe('视图解析诊断页（/Cube/ViewTrace）', () => {
  test('页面加载显示表单与候选路径表格', async ({ page }) => {
    await page.goto('/Cube/ViewTrace');
    await expect(page.getByText('视图解析诊断', { exact: true }).first()).toBeVisible({ timeout: 15000 });

    // 表单：区域/控制器/视图/主题 + 解析按钮（用 placeholder 精确定位，避免与 tab 标题冲突）
    await expect(page.getByPlaceholder('Admin')).toBeVisible();
    await expect(page.getByPlaceholder('User')).toBeVisible();
    await expect(page.getByPlaceholder('Index')).toBeVisible();
    await expect(page.getByPlaceholder('ACE')).toBeVisible();
    await expect(page.getByRole('button', { name: /解\s*析/ })).toBeVisible();

    // 候选路径表格（默认 Index）
    await expect(page.locator('th', { hasText: '候选路径' })).toBeVisible({ timeout: 15000 });
    await expect(page.locator('th', { hasText: '物理文件' })).toBeVisible();
    await expect(page.locator('th', { hasText: '实际命中' })).toBeVisible();
  });

  test('输入控制器解析后渲染候选路径', async ({ page }) => {
    await page.goto('/Cube/ViewTrace');
    await expect(page.locator('th', { hasText: '候选路径' })).toBeVisible({ timeout: 15000 });

    // 输入区域 Admin + 控制器 User 并解析
    await page.getByPlaceholder('Admin').fill('Admin');
    await page.getByPlaceholder('User').fill('User');
    await page.getByRole('button', { name: /解\s*析/ }).click();

    // 候选路径行出现，含 /Areas/Admin/Views/User 前缀路径（第 1 位主题变体 User_Ace）
    const firstRow = page.locator('tbody tr').first();
    await expect(firstRow).toBeVisible({ timeout: 15000 });
    const text = await firstRow.innerText();
    expect(text).toContain('/Areas/Admin/Views/User');
    expect(text).toMatch(/优先级|1/);
  });
});
