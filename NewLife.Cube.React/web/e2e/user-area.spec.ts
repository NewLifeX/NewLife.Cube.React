/**
 * 用户页省市区级联选择器 E2E（对齐 MVC _Area2/_Area4）
 *
 * 覆盖：搜索区「地区」级联控件存在、选省加载市、搜索请求携带 AreaId、
 * 编辑表单「地区」为级联（非数字输入）且可展开选择。
 * 后端 UserController：SearchFields AreaId ItemType=area3、表单 AreaId ItemType=area4。
 */
import { expect, test } from '@playwright/test';

const TABLE_TIMEOUT = 15000;
const ROW = '.ant-table-tbody tr.ant-table-row';

/** 按标签文本定位搜索区字段所在项，再取控件 */
function searchCell(page: import('@playwright/test').Page, label: string) {
  return page.locator('.cube-search-item', { hasText: label }).first();
}

/** 按标签文本定位表单字段所在单元格，再取控件 */
function fieldCell(page: import('@playwright/test').Page, label: string) {
  return page.locator('.ant-modal').locator('.cube-form-inline-cell', { hasText: label }).first();
}

test.describe('用户页省市区级联选择器（/Admin/User）', () => {
  test('搜索区出现「地区」级联，选省→市→搜索携带 AreaId', async ({ page }) => {
    await page.goto('/Admin/User');
    await page.waitForSelector(ROW, { timeout: TABLE_TIMEOUT });

    // 搜索区「地区」为级联选择器（非数字范围）
    const areaItem = searchCell(page, '地区');
    await expect(areaItem).toHaveCount(1);
    await expect(areaItem.locator('.ant-cascader')).toBeVisible();
    await expect(areaItem.locator('.ant-input-number')).toHaveCount(0);

    // 打开级联：省级选项加载（数据来自 /Cube/AreaChilds）
    await areaItem.locator('.ant-cascader').click();
    const menus = page.locator('.ant-cascader-dropdown:visible .ant-cascader-menu');
    await expect(menus.first().locator('.ant-cascader-menu-item').first()).toBeVisible({ timeout: 8000 });

    // 选第一个省 → 第二级（市）出现
    const provinceCount = await menus.first().locator('.ant-cascader-menu-item').count();
    expect(provinceCount).toBeGreaterThan(0);
    await menus.first().locator('.ant-cascader-menu-item').first().click();
    await expect(menus.nth(1).locator('.ant-cascader-menu-item').first()).toBeVisible({ timeout: 8000 });

    // 选第一个市 → 回填选中（changeOnSelect 允许选中间级；antd6 级联基于 Select，选中区类名 .ant-select-content-has-value）
    await menus.nth(1).locator('.ant-cascader-menu-item').first().click();
    await expect(areaItem.locator('.ant-select-content-has-value').first()).toBeVisible({ timeout: 5000 });
    await expect(areaItem.locator('.ant-select-content-has-value').first()).not.toBeEmpty();

    // 监听列表请求，断言携带 AreaId=<数值>
    let listReq: string | null = null;
    const onReq = (req: { url: () => string; method: () => string }) => {
      if (req.url().includes('/api/Admin/User') && req.method() === 'GET') listReq = req.url();
    };
    page.on('request', onReq as never);

    await page.getByRole('button', { name: /搜\s*索/ }).click();
    await page.waitForTimeout(1200);

    expect(listReq, '搜索请求应携带 AreaId').toMatch(/[?&]AreaId=\d+/);
    // 搜索后列表仍正常渲染
    await expect(page.locator(ROW).first()).toBeVisible({ timeout: TABLE_TIMEOUT });
    page.off('request', onReq as never);
  });

  test('编辑表单「地区」为级联选择器（非数字输入）', async ({ page }) => {
    await page.goto('/Admin/User');
    await page.waitForSelector(ROW, { timeout: TABLE_TIMEOUT });

    // 打开第一行编辑弹窗
    await page.locator(ROW).first().locator('td:last-child').getByRole('button', { name: /编\s*辑/ }).click();
    await page.waitForSelector('.ant-modal:not([style*="display: none"])', { timeout: 8000 });

    // 地区字段为级联（非数字输入），可展开选择省份
    const cell = fieldCell(page, '地区');
    await expect(cell.locator('.ant-cascader')).toBeVisible({ timeout: 8000 });
    await expect(cell.locator('.ant-input-number')).toHaveCount(0);

    await cell.locator('.ant-cascader').click();
    const menus = page.locator('.ant-cascader-dropdown:visible .ant-cascader-menu');
    await expect(menus.first().locator('.ant-cascader-menu-item').first()).toBeVisible({ timeout: 8000 });
  });
});
