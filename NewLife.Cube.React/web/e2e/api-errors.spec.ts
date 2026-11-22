/**
 * 全局 API 错误处理 E2E（FND-4 / LIST-9）
 *
 * 覆盖：
 * - 业务错误码：统一 message 提示，页面不崩、仍可交互；
 * - 实体接口 HTTP 401：清理登录态并跳转登录页（携带回跳参数）。
 *
 * 用 page.route 只拦截列表请求，meta 请求照常放行；每个用例使用独立浏览器上下文，
 * 清理令牌不会影响其它 spec 的共享登录态。
 */
import { expect, test } from '@playwright/test';

const LIST_API = /\/api\/Admin\/User\?/;

test.describe('全局 API 错误处理（FND-4）', () => {
  test('列表业务错误统一提示且页面不崩', async ({ page }) => {
    await page.goto('/Admin/User');
    await page.waitForSelector('.ant-table-tbody tr.ant-table-row', { timeout: 15000 });

    // 列表加载完成后再注入错误，避免提示在页面加载期间弹出又消失
    await page.route(LIST_API, (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ code: 1, message: '模拟业务错误', data: null }),
      }),
    );
    const errors: string[] = [];
    page.on('pageerror', (e) => errors.push(e.message));

    const messageShown = page
      .locator('.ant-message')
      .getByText('模拟业务错误')
      .waitFor({ state: 'visible', timeout: 15000 });
    await page.getByRole('button', { name: '刷新' }).click();
    await messageShown;

    // 页面仍可交互（搜索按钮可见），未白屏
    await expect(page.getByRole('button', { name: /搜\s*索/ })).toBeVisible();
    expect(errors).toEqual([]);
  });

  test('实体接口 401 清理会话并跳转登录页', async ({ page }) => {
    await page.goto('/Admin/User');
    await page.waitForSelector('.ant-table-tbody tr.ant-table-row', { timeout: 15000 });

    // 列表加载完成后再注入 401，由「刷新」触发会话失效
    await page.route(LIST_API, (route) =>
      route.fulfill({ status: 401, contentType: 'application/json', body: '{}' }),
    );

    await page.getByRole('button', { name: '刷新' }).click();
    await page.waitForURL(/\/login\?r=/, { timeout: 20000 });
    await expect(page.getByPlaceholder('用户名 / 邮箱 / 手机号')).toBeVisible();
  });
});
