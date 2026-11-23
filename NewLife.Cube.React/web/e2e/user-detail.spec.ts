/**
 * 用户详情页 E2E
 *
 * 覆盖：列表移除 MVC 导航列、头像/名称进入详情、7 个关联 Tab、
 * 查看全部、Tab 深链、?userId= 不再误判为表单、OrderByKey 降序参数。
 */
import { test, expect } from '@playwright/test';

/** 从列表首行头像进入详情页并返回用户主键 */
async function openFirstUserDetail(page: import('@playwright/test').Page): Promise<string> {
  await page.goto('/Admin/User');
  await expect(page.locator('.ant-table-tbody tr.ant-table-row').first()).toBeVisible({ timeout: 15000 });

  const cell = page.locator('.cube-cell-activate').first();
  await expect(cell).toBeVisible();
  await cell.click();
  await expect(page).toHaveURL(/\/Admin\/User\/Detail\/\d+/);

  const match = /\/Admin\/User\/Detail\/(\d+)/.exec(page.url());
  expect(match).not.toBeNull();
  return match![1];
}

test('用户列表移除 MVC 导航列，头像/名称可进入详情页', async ({ page }) => {
  await page.goto('/Admin/User');
  await expect(page.locator('.ant-table-tbody tr.ant-table-row').first()).toBeVisible({ timeout: 15000 });

  // 四个旧导航列不应再出现（未本地化时字段名会原样显示）
  for (const name of ['Link', 'Token', 'Log', 'OAuthLog']) {
    await expect(page.locator('.ant-table-thead th', { hasText: new RegExp(`^${name}$`) })).toHaveCount(0);
  }

  await expect(page.locator('.cube-cell-activate').first()).toBeVisible();
  await page.locator('.cube-cell-activate').first().click();
  await expect(page).toHaveURL(/\/Admin\/User\/Detail\/\d+/);

  for (const label of ['基本信息', '第三方授权', '令牌', '在线会话', '操作日志', 'OAuth 日志', '通知记录']) {
    await expect(page.getByRole('tab', { name: new RegExp(label) })).toBeVisible();
  }
});

test('用户详情关联 Tab 直接嵌入原列表页，并可打开详情弹窗', async ({ page }) => {
  const userId = await openFirstUserDetail(page);

  // 切到操作日志：Tab 内应加载 Log 实体列表（带 userId 过滤）
  const listReq = page.waitForRequest(
    (r) => /\/api\/Admin\/Log(\?|$)/.test(r.url()) && r.method() === 'GET' && /[?&]userId=/.test(r.url()),
    { timeout: 20000 },
  );
  await page.getByRole('tab', { name: /操作日志/ }).click();
  expect(new URL((await listReq).url()).searchParams.get('userId')).toBe(userId);

  // 嵌入的是完整列表页：搜索区 + 表格 + 分页都在，而不是精简的最近 N 条
  const panel = page.locator('.cube-user-detail-main');
  await expect(panel.locator('.cube-search-panel')).toBeVisible({ timeout: 20000 });
  await expect(panel.locator('.ant-table-tbody tr.ant-table-row').first()).toBeVisible({ timeout: 20000 });
  await expect(panel.locator('.ant-pagination')).toBeVisible();

  // 行内「查看」打开详情弹窗（与列表页一致）
  await panel.locator('.cube-op-btn-op-view').first().click();
  await expect(page.locator('.ant-modal')).toBeVisible({ timeout: 15000 });
});

test('用户详情 Tab 支持 ?tab= 深链', async ({ page }) => {
  const userId = await openFirstUserDetail(page);

  await page.goto(`/Admin/User/Detail/${userId}?tab=tokens`);
  const tokenTab = page.getByRole('tab', { name: /令牌/ });
  await expect(tokenTab).toHaveAttribute('aria-selected', 'true');
  await expect(page).toHaveURL(new RegExp('tab=tokens'));
});

test('关联列表页 ?userId= 不再打开新增表单（独立列表页仍可用）', async ({ page }) => {
  const userId = await openFirstUserDetail(page);

  await page.goto(`/Admin/UserToken?userId=${userId}`);
  await expect(page.locator('.ant-table')).toBeVisible({ timeout: 15000 });
  await expect(page.locator('.ant-form')).toHaveCount(0);
});

test('OrderByKey 开启时列表请求携带主键降序', async ({ page }) => {
  await page.route('**/api/Admin/User/meta', async (route) => {
    const response = await route.fetch();
    const json = await response.json();
    if (json?.data?.setting) json.data.setting.orderByKey = true;
    await route.fulfill({ response, json });
  });

  const requestPromise = page.waitForRequest(
    (req) => /\/api\/Admin\/User(\?|$)/.test(req.url()) && req.method() === 'GET',
  );
  await page.goto('/Admin/User');
  const request = await requestPromise;
  const url = new URL(request.url());

  expect(url.searchParams.get('sort')).toBe('Id');
  expect(url.searchParams.get('desc')).toBe('true');
});
