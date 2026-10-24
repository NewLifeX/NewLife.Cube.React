/**
 * 通知未读闭环 E2E（CMP-13）
 *
 * 皮肤依赖 `/Cube/Notice/*` 约定端点（见 `rendering/noticeProvider.ts`）。当前后端未实现，
 * 故用 `page.route` 构造契约场景验证：未读角标、下拉列表、「全部已读」请求。
 * 另验证端点缺失时静默降级（无角标、无页面错误）。
 */
import { expect, test } from '@playwright/test';

test.describe('通知未读闭环（CMP-13）', () => {
  test('未读数角标、下拉列表与「全部已读」', async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', (e) => errors.push(e.message));

    let readAllCalls = 0;
    await page.route('**/api/Cube/Notice/Unread*', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json; charset=utf-8',
        body: JSON.stringify({
          code: 0,
          data: {
            count: 3,
            items: [
              { id: 1, title: '待审批采购单', content: '共 2 张待处理', time: '2026-10-24 09:00' },
              { id: 2, title: '系统升级通知', content: '今晚 23:00 维护', time: '2026-10-23 18:00' },
            ],
          },
        }),
      });
    });
    await page.route('**/api/Cube/Notice/ReadAll*', async (route) => {
      readAllCalls += 1;
      await route.fulfill({
        status: 200,
        contentType: 'application/json; charset=utf-8',
        body: JSON.stringify({ code: 0 }),
      });
    });

    await page.goto('/');
    // 默认懒加载（不预拉，避免端点缺失时 404 污染）：点击铃铛后拉取并显示角标与列表
    await page.getByRole('button', { name: /通知/ }).first().click();
    await expect(page.getByText('待审批采购单')).toBeVisible({ timeout: 15000 });
    await expect(page.locator('.ant-badge-count').first()).toHaveText('3');
    await expect(page.getByText('系统升级通知')).toBeVisible();

    // 全部已读 → 触发请求
    await page.getByText('全部已读').click();
    await expect.poll(() => readAllCalls, { timeout: 10000 }).toBeGreaterThan(0);

    expect(errors, `页面错误: ${errors.join(' | ')}`).toEqual([]);
  });

  test('端点缺失时静默降级：无角标且页面正常', async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', (e) => errors.push(e.message));

    await page.goto('/');
    // 铃铛仍在（顶栏入口），但无未读角标
    await expect(page.getByRole('button', { name: /通知/ }).first()).toBeVisible({ timeout: 15000 });
    await expect(page.locator('.ant-badge-count')).toHaveCount(0);

    await page.getByRole('button', { name: /通知/ }).first().click();
    await expect(page.getByText('暂无通知')).toBeVisible({ timeout: 10000 });

    expect(errors, `页面错误: ${errors.join(' | ')}`).toEqual([]);
  });
});
