/**
 * 树节点排序 E2E（LIST-18）
 *
 * 前端在树形列表（treeField 生效）的行操作区渲染「上移/下移」，调用后端
 * `EntityTreeApiController` 约定的 `POST {type}/Up|Down?id=`：
 * - 后端未继承该基类 → 404/405 → 前端提示「当前实体不支持排序」并降级；
 * - 后端提供动作 → 返回 `{code:0}` → 提示成功并刷新列表。
 *
 * 说明：Cube 的树控制器会在静态构造中移除父字段，`/Admin/Menu` 的 meta.list 因此没有 `ParentID`，
 * 前端识别不到树形。这里用 `page.route` 复现「后端下发父字段」的契约场景
 * （业务侧自行保留父字段时即为此形态），不依赖演示库的具体实体配置。
 */
import { expect, test } from '@playwright/test';
import type { Page } from '@playwright/test';

const ROW = '.ant-table-tbody tr.ant-table-row';

/** 在真实 meta 上补回父字段，使前端识别为树形列表 */
async function injectParentField(page: Page) {
  await page.route('**/api/Admin/Menu/meta*', async (route) => {
    const response = await route.fetch();
    const body = await response.json();
    const data = body?.data ?? {};
    const list: Record<string, unknown>[] = Array.isArray(data.list) ? [...data.list] : [];
    if (!list.some((f) => String(f.name).toLowerCase() === 'parentid')) {
      list.push({ name: 'ParentID', displayName: '父级编号', typeName: 'Int32', visible: false });
    }
    data.list = list;
    await route.fulfill({ response, json: body });
  });
}

test.describe('树节点排序（LIST-18）', () => {
  test('树形列表渲染上移/下移；后端无该动作时提示不支持排序', async ({ page }) => {
    await injectParentField(page);
    await page.goto('/Admin/Menu');
    await page.waitForSelector(ROW, { timeout: 20000 });

    const up = page.getByRole('button', { name: /上\s*移/ }).first();
    const down = page.getByRole('button', { name: /下\s*移/ }).first();
    await expect(up).toBeVisible({ timeout: 10000 });
    await expect(down).toBeVisible();

    await up.click();
    // 当前后端未提供 Up 动作 → 友好降级，而非静默失败或页面报错
    await expect(page.locator('.ant-message')).toContainText(/不支持排序/, { timeout: 10000 });
  });

  test('后端提供 Up 动作时完成上移并刷新列表', async ({ page }) => {
    let calls = 0;
    await injectParentField(page);
    await page.route('**/api/Admin/Menu/Up*', async (route) => {
      calls += 1;
      await route.fulfill({
        status: 200,
        contentType: 'application/json; charset=utf-8',
        body: JSON.stringify({ code: 0, message: 'ok' }),
      });
    });

    await page.goto('/Admin/Menu');
    await page.waitForSelector(ROW, { timeout: 20000 });
    await page.getByRole('button', { name: /上\s*移/ }).first().click();

    await expect(page.locator('.ant-message')).toContainText(/操作成功/, { timeout: 10000 });
    await expect.poll(() => calls, { timeout: 10000 }).toBeGreaterThan(0);
  });
});
