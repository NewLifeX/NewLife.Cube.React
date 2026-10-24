/**
 * 表格列设置 E2E（齿轮按钮 → 列显隐/顺序 → 本地持久化）
 *
 * 覆盖：齿轮按钮存在、打开面板展示字段、取消勾选保存后列消失且**刷新后仍隐藏**
 * （LIST-13：列序/显隐存 `localStorage['cube-columns:{type}']`，不写后端）、恢复默认后列重现。
 */
import { expect, test } from '@playwright/test';

test.describe('表格列设置（齿轮 → 显隐 → 持久化）', () => {
  test('齿轮按钮存在且面板展示字段列表', async ({ page }) => {
    await page.goto('/Cube/App');
    await expect(page.locator('tbody tr').first()).toBeVisible({ timeout: 15000 });

    // 工具栏齿轮（列设置）按钮
    const gear = page.getByRole('button', { name: '列设置' });
    await expect(gear).toBeVisible();

    // 打开面板：字段 checkbox 列表 + 保存/恢复默认（AntD 两字按钮自动加空格）
    await gear.click();
    const panel = page.locator('.ant-popover:visible').first();
    await expect(panel).toBeVisible();
    await expect(panel.getByText('列设置', { exact: true }).first()).toBeVisible();
    await expect(panel.locator('.ant-checkbox-wrapper').first()).toBeVisible();
    await expect(page.getByRole('button', { name: /保\s*存/ }).last()).toBeVisible();
    await expect(page.getByRole('button', { name: /恢\s*复\s*默\s*认/ }).last()).toBeVisible();
  });

  test('取消勾选保存后列隐藏，刷新后仍隐藏，恢复默认后列重现', async ({ page }) => {
    await page.goto('/Cube/App');
    await expect(page.locator('th', { hasText: '名称' })).toBeVisible({ timeout: 15000 });

    // 打开列设置，取消「名称」列勾选并保存
    await page.getByRole('button', { name: '列设置' }).click();
    const panel = page.locator('.ant-popover:visible').first();
    await expect(panel).toBeVisible();
    const nameBox = panel.locator('.ant-checkbox-wrapper', { hasText: '名称' }).first();
    await expect(nameBox).toBeVisible();
    await nameBox.locator('input').uncheck({ force: true });
    await page.getByRole('button', { name: /保\s*存/ }).last().click();

    // 保存后：名称列消失，且偏好已写入 localStorage（LIST-13）
    await expect(page.locator('th', { hasText: '名称' })).toHaveCount(0, { timeout: 15000 });
    const stored = await page.evaluate(() => {
      const key = Object.keys(localStorage).find((k) => k.startsWith('cube-columns:'));
      return key ? localStorage.getItem(key) : null;
    });
    expect(stored).toBeTruthy();

    // 刷新后仍保持隐藏（浏览器偏好优先于 /meta 默认）
    await page.reload();
    await expect(page.locator('th', { hasText: '名称' })).toHaveCount(0, { timeout: 15000 });

    // 恢复默认：重新打开面板 → 恢复默认 → 名称列重现
    await page.getByRole('button', { name: '列设置' }).click();
    await expect(page.locator('.ant-popover:visible').first()).toBeVisible();
    await page.getByRole('button', { name: /恢\s*复\s*默\s*认/ }).last().click();
    await expect(page.locator('th', { hasText: '名称' })).toBeVisible({ timeout: 15000 });
  });
});
