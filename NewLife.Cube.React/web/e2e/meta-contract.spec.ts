/**
 * 页面呈现契约 E2E（TST-10）
 *
 * 验证前端对 `/meta` 自描述契约的两类扩展字段：
 * - `search[].kind=range`：区间查询项（`name`/`end` 双参，如 `dtStart`/`dtEnd`）渲染为区间控件；
 * - `toolbar[]`：后端声明的自定义按钮（link / request / custom 三类）。
 *
 * 已发布的 Cube 包（6.15.2026.1023）尚未下发这两类字段，故本用例用 `page.route` 在真实 meta
 * 响应上**追加**契约字段来构造场景——这属于前端契约测试，与后端版本解耦；上游升级后可直接改回真实数据。
 */
import { expect, test } from '@playwright/test';

const ROW = '.ant-table-tbody tr.ant-table-row';

/** 在真实 meta 响应上追加区间查询项与自定义工具栏按钮 */
async function injectMeta(page: import('@playwright/test').Page) {
  await page.route('**/api/Admin/User/meta*', async (route) => {
    const response = await route.fetch();
    const body = await response.json();
    const data = body?.data ?? {};

    // 1) 区间查询项：主时间字段收敛为 dtStart/dtEnd（对齐 PageMetaBuilder.BuildSearch）
    const search: Record<string, unknown>[] = Array.isArray(data.search) ? [...data.search] : [];
    search.push({
      name: 'dtStart',
      end: 'dtEnd',
      field: 'CreateTime',
      kind: 'range',
      displayName: '创建时间',
      typeName: 'DateTime',
    });
    data.search = search;

    // 2) 自定义工具栏按钮：link（可带查询参数）/ request（需选中）/ custom（未注册渲染器应忽略）
    data.toolbar = [
      {
        name: 'refreshCurrent',
        kind: 'link',
        displayName: '刷新当前页',
        url: '/Admin/User?from=toolbar',
        appendQuery: true,
      },
      {
        name: 'batchExport',
        kind: 'request',
        displayName: '批量导出',
        action: 'ExportAll',
        method: 'POST',
        include: ['keys'],
        requiresSelection: true,
      },
      {
        name: 'unregistered',
        kind: 'custom',
        displayName: '未注册按钮',
        renderer: 'not-registered',
      },
    ];

    await route.fulfill({ response, json: body });
  });
}

test.describe('meta 自描述契约（TST-10）', () => {
  test('区间查询项渲染为区间控件，并提交 name/end 双参', async ({ page }) => {
    await injectMeta(page);
    await page.goto('/Admin/User');
    await page.waitForSelector(ROW, { timeout: 20000 });

    // 搜索区默认折叠（区间项排在末尾），先展开
    const expand = page.getByRole('button', { name: /展开/ });
    if (await expand.count()) await expand.first().click();

    // 区间项渲染为 RangePicker（`.ant-picker-range`），显示名来自契约
    await expect(page.locator('.ant-picker-range').first()).toBeVisible({ timeout: 10000 });
    await expect(page.getByText('创建时间').first()).toBeVisible();
    // 双参提交（dtStart/dtEnd）由 SearchBar 单测覆盖（区间项提交 name 与 end 两参），
    // 此处只验证契约驱动的控件分派与可交互，避免依赖 antd 日期面板的交互细节
    await expect(page.locator('.ant-picker-range input').first()).toBeEditable();
  });

  test('工具栏自定义按钮：link 可跳转、request 按选中态启停、custom 未注册不渲染', async ({ page }) => {
    await injectMeta(page);
    await page.goto('/Admin/User');
    await page.waitForSelector(ROW, { timeout: 20000 });

    // link 按钮：渲染为链接且带 url
    const link = page.locator('a', { hasText: '刷新当前页' });
    await expect(link).toHaveCount(1);
    await expect(link).toHaveAttribute('href', /\/Admin\/User\?from=toolbar/);

    // request 按钮：requiresSelection=true，未选中时禁用
    const requestBtn = page.locator('button', { hasText: '批量导出' });
    await expect(requestBtn).toHaveCount(1);
    await expect(requestBtn).toBeDisabled();

    // 选中一行后启用
    await page.locator(`${ROW} .ant-checkbox-input`).first().check();
    await expect(requestBtn).toBeEnabled({ timeout: 5000 });

    // custom 按钮未注册渲染器 → 不渲染（降级忽略，不报错）
    await expect(page.getByText('未注册按钮')).toHaveCount(0);
  });
});
