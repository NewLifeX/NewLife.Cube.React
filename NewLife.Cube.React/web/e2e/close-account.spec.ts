/**
 * 注销账号 E2E
 *
 * 覆盖标准场景：
 * 1. 安全中心展示"注销账号"危险操作卡与警示文案（admin 会话，非破坏）
 * 2. 一次性用户的完整注销流程：注册 → 登录 → 二次确认注销 → 跳转登录页 → 账号不可再登录
 *
 * 注销为不可逆操作，破坏性用例使用一次性注册用户 + 独立匿名上下文，避免影响 admin 共享会话。
 * 前置：被测站点包含 POST /Auth/CloseAccount 端点（NewLife.Cube API 版）。
 */
import { expect, test } from '@playwright/test';

test.describe('注销账号：安全中心入口（页面加载）', () => {
  test('注销卡与警示文案可见', async ({ page }) => {
    await page.goto('/profile/security');
    await expect(page.getByText('注销后账号将被禁用', { exact: false })).toBeVisible({ timeout: 10000 });
    await expect(page.getByRole('button', { name: '注销账号' })).toBeVisible();
  });
});

test.describe('注销账号：完整流程（一次性用户，破坏性）', () => {
  // 注销会吊销令牌并禁用账号：使用独立匿名上下文，不复用 admin 登录态
  test.use({ storageState: { cookies: [], origins: [] } });

  test('注册→登录→注销→跳登录页→不可再登录', async ({ page, request }) => {
    const username = `E2E_Close_${Date.now()}`;
    const password = 'E2eP@ss123';

    // 1. 注册一次性用户（API 直连；若环境关闭注册，本用例会以注册失败信息快速失败）
    const reg = await request.post('/Auth/Register', {
      data: { username, password, confirmPassword: password },
    });
    const regJson = (await reg.json()) as { code: number; message?: string };
    expect(regJson.code, `注册失败: ${regJson.message ?? ''}`).toBe(0);

    // 2. UI 登录
    await page.goto('/login');
    await page.getByPlaceholder('用户名 / 邮箱 / 手机号').fill(username);
    await page.getByPlaceholder('请输入密码').fill(password);
    await page.getByRole('button', { name: '登 录' }).click();
    await page.waitForURL('**/');

    // 3. 安全中心：注销卡可见
    await page.goto('/profile/security');
    await expect(page.getByText('注销后账号将被禁用', { exact: false })).toBeVisible({ timeout: 10000 });

    // 4. 二次确认后注销
    await page.getByRole('button', { name: '注销账号' }).click();
    await expect(page.getByText('确定要注销账号吗', { exact: false })).toBeVisible();
    await page.getByRole('button', { name: '确认注销' }).click();

    // 5. 注销成功：清理登录态并跳转登录页（登出接口 401 已被前端容错）
    await page.waitForURL(/\/login/, { timeout: 15000 });
    await expect(page.getByPlaceholder('用户名 / 邮箱 / 手机号')).toBeVisible();

    // 6. 注销后不可再登录（账号已禁用）
    await page.getByPlaceholder('用户名 / 邮箱 / 手机号').fill(username);
    await page.getByPlaceholder('请输入密码').fill(password);
    await page.getByRole('button', { name: '登 录' }).click();
    await expect(page.locator('.ant-message')).toBeVisible({ timeout: 8000 });
    await expect(page).toHaveURL(/\/login/);
  });
});
