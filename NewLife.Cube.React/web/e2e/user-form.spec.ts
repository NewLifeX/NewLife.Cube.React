/**
 * 用户表单字段控件 E2E（对齐 MVC 表单行为）
 *
 * 覆盖：性别枚举下拉、生日纯日期、角色组多选、备注 wangEditor 富文本。
 * 新增弹窗字段按 Category 分 Tabs（常规设置/登录信息/扩展），跨 Tab 交互需先点击对应标签。
 */
import { expect, test } from '@playwright/test';

const TABLE_TIMEOUT = 15000;
const ROW = '.ant-table-tbody tr.ant-table-row';

/** 按标签文本定位表单字段所在单元格，再取控件 */
function fieldCell(page: import('@playwright/test').Page, label: string) {
  return page.locator('.ant-modal').locator('.cube-form-inline-cell', { hasText: label }).first();
}

test.describe('用户表单字段控件（/Admin/User 新增弹窗）', () => {
  test('性别枚举渲染下拉且选项为 未知/男/女', async ({ page }) => {
    await page.goto('/Admin/User');
    await page.waitForSelector(ROW, { timeout: TABLE_TIMEOUT });
    await page.getByRole('button', { name: /新增/ }).click();
    await page.waitForSelector('.ant-modal:not([style*="display: none"])', { timeout: 8000 });

    // 常规设置 Tab（默认激活）内性别字段
    const cell = fieldCell(page, '性别');
    const select = cell.locator('.ant-select');
    await expect(select).toBeVisible({ timeout: 8000 });
    // 点击展开选项
    await select.click();
    const dropdown = page.locator('.ant-select-dropdown:visible');
    await expect(dropdown.getByText('未知').first()).toBeVisible({ timeout: 5000 });
    await expect(dropdown.getByText('男').first()).toBeVisible();
    await expect(dropdown.getByText('女').first()).toBeVisible();
    // 选择「男」回填（antd v6 单选选中值渲染在 content-has-value）
    await dropdown.getByText('男').first().click();
    await expect(cell.locator('.ant-select-content-has-value')).toHaveText('男');
  });

  test('生日渲染纯日期选择（无时间）', async ({ page }) => {
    await page.goto('/Admin/User');
    await page.waitForSelector(ROW, { timeout: TABLE_TIMEOUT });
    await page.getByRole('button', { name: /新增/ }).click();
    await page.waitForSelector('.ant-modal:not([style*="display: none"])', { timeout: 8000 });

    const cell = fieldCell(page, '生日');
    const picker = cell.locator('.ant-picker');
    await expect(picker).toBeVisible({ timeout: 8000 });
    // 打开日期面板并选一个日期
    await picker.click();
    const panel = page.locator('.ant-picker-dropdown:visible');
    // 纯日期面板不含时间列（showTime 会有 .ant-picker-time-panel）
    await expect(panel.locator('.ant-picker-time-panel')).toHaveCount(0);
    // 选中今天（面板今日按钮）
    await panel.locator('.ant-picker-cell-today, .ant-picker-today-btn').first().click().catch(async () => {
      await panel.locator('.ant-picker-cell:not(.ant-picker-cell-out-view)').first().click();
    });
    // 回填值应为纯日期 yyyy-MM-dd
    const input = picker.locator('input');
    await expect(input).toHaveValue(/^\d{4}-\d{2}-\d{2}$/);
  });

  test('角色组渲染多选下拉', async ({ page }) => {
    await page.goto('/Admin/User');
    await page.waitForSelector(ROW, { timeout: TABLE_TIMEOUT });
    await page.getByRole('button', { name: /新增/ }).click();
    await page.waitForSelector('.ant-modal:not([style*="display: none"])', { timeout: 8000 });

    // 切到「登录信息」Tab
    await page.locator('.ant-modal .ant-tabs-tab', { hasText: '登录信息' }).click();
    const cell = fieldCell(page, '角色组');
    const select = cell.locator('.ant-select');
    await expect(select).toBeVisible({ timeout: 8000 });
    // 多选模式：antd 多选带 .ant-select-multiple
    await expect(cell.locator('.ant-select-multiple')).toHaveCount(1);
    // 展开并等待选项渲染（count 不自动等待，需先 expect 可见）
    await select.click();
    const dropdown = page.locator('.ant-select-dropdown:visible');
    const options = dropdown.locator('.ant-select-item-option');
    await expect(options.first()).toBeVisible({ timeout: 5000 });
    const count = await options.count();
    expect(count).toBeGreaterThan(0);
    // 勾选第一个角色，选中 tag 出现在 content-item（antd v6 结构）
    await options.nth(0).click();
    const firstLabel = (await options.nth(0).textContent())?.trim() ?? '';
    const tags = cell.locator('.ant-select-content .ant-select-selection-item');
    await expect(tags.first()).toBeVisible({ timeout: 5000 });
    expect((await tags.first().textContent())?.trim()).toBe(firstLabel);
  });

  test('备注渲染 wangEditor 富文本（工具栏 + 编辑区）', async ({ page }) => {
    await page.goto('/Admin/User');
    await page.waitForSelector(ROW, { timeout: TABLE_TIMEOUT });
    await page.getByRole('button', { name: /新增/ }).click();
    await page.waitForSelector('.ant-modal:not([style*="display: none"])', { timeout: 8000 });

    // 切到「扩展」Tab
    await page.locator('.ant-modal .ant-tabs-tab', { hasText: '扩展' }).click();
    const cell = fieldCell(page, '备注');
    // wangEditor 工具栏容器（.w-e-toolbar）+ 编辑区（.w-e-text-container）
    await expect(cell.locator('.w-e-toolbar')).toBeVisible({ timeout: 8000 });
    await expect(cell.locator('.w-e-text-container')).toBeVisible();
  });
});
