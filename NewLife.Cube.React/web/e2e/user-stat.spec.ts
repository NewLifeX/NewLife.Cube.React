/**
 * 用户统计页图表视图 E2E（UserStat + OnGetCharts / GET {type}/charts）
 *
 * 覆盖：
 * - 列表页加载无错误且展示数据
 * - 有图表数据时显示 表格/图表 视图切换（Segmented）
 * - 切换图表视图后 ECharts canvas 渲染（3 个图表：主折线 + 箱线 + K线）
 * - 切回表格视图正常、往返切换无控制台错误
 *
 * 注意：/Admin/UserStat 是隐藏菜单实体页（[Menu(0,false)]），直接访问路径。
 */
import { expect, test } from '@playwright/test';

const TABLE_TIMEOUT = 15000;
/** 数据行（排除 antd 测量行） */
const ROW = '.ant-table-tbody tr.ant-table-row';
/** 表格/图表视图切换（Segmented） */
const SEG = '.ant-segmented-item';

test.describe('用户统计图表视图（/Admin/UserStat）', () => {
  test('列表页加载无错误且展示数据', async ({ page }) => {
    const errors: string[] = [];
    page.on('console', (m) => {
      if (m.type() === 'error') errors.push(m.text());
    });
    page.on('pageerror', (e) => errors.push(e.message));

    await page.goto('/Admin/UserStat');
    await expect(page.locator(ROW).first()).toBeVisible({ timeout: TABLE_TIMEOUT });
    expect(errors.filter((e) => !e.includes('favicon')), `控制台错误: ${errors.join('; ')}`).toEqual([]);
  });

  test('有图表数据时显示 表格/图表 视图切换', async ({ page }) => {
    await page.goto('/Admin/UserStat');
    await page.waitForSelector(ROW, { timeout: TABLE_TIMEOUT });
    // 等待图表能力探测完成（loadChart 返回非空 → canChart=true → Segmented 渲染）
    await expect(page.locator(SEG).filter({ hasText: '图表' })).toBeVisible({ timeout: TABLE_TIMEOUT });
    // 表格仍可见
    await expect(page.locator(ROW).first()).toBeVisible({ timeout: TABLE_TIMEOUT });
  });

  test('切换图表视图渲染 3 个 ECharts 图表且无控制台错误', async ({ page }) => {
    const errors: string[] = [];
    page.on('console', (m) => {
      if (m.type() === 'error') errors.push(m.text());
    });
    page.on('pageerror', (e) => errors.push(e.message));

    await page.goto('/Admin/UserStat');
    await page.waitForSelector(ROW, { timeout: TABLE_TIMEOUT });
    await expect(page.locator(SEG).filter({ hasText: '图表' })).toBeVisible({ timeout: TABLE_TIMEOUT });

    // 切换到图表视图
    await page.evaluate(() => {
      const el = Array.from(document.querySelectorAll('.ant-segmented-item')).find((e) => e.textContent?.includes('图表'));
      (el as HTMLElement | undefined)?.click();
    });
    // 3 个图表（主折线 + 箱线 + K线）canvas 渲染
    await expect(page.locator('.cube-chart-view')).toBeVisible({ timeout: TABLE_TIMEOUT });
    await expect(page.locator('.cube-chart-view canvas')).toHaveCount(3, { timeout: TABLE_TIMEOUT });
    // 无 React 渲染错误
    await expect(page.locator('h2').filter({ hasText: 'Unexpected Application Error' })).toHaveCount(0);
    expect(errors.filter((e) => !e.includes('favicon')), `控制台错误: ${errors.join('; ')}`).toEqual([]);
  });

  test('表格/图表往返切换正常', async ({ page }) => {
    await page.goto('/Admin/UserStat');
    await page.waitForSelector(ROW, { timeout: TABLE_TIMEOUT });
    await expect(page.locator(SEG).filter({ hasText: '图表' })).toBeVisible({ timeout: TABLE_TIMEOUT });

    // 表格 → 图表
    await page.evaluate(() => {
      const el = Array.from(document.querySelectorAll('.ant-segmented-item')).find((e) => e.textContent?.includes('图表'));
      (el as HTMLElement | undefined)?.click();
    });
    await expect(page.locator('.cube-chart-view canvas')).toHaveCount(3, { timeout: TABLE_TIMEOUT });

    // 图表 → 表格
    await page.evaluate(() => {
      const el = Array.from(document.querySelectorAll('.ant-segmented-item')).find((e) => e.textContent?.includes('表格'));
      (el as HTMLElement | undefined)?.click();
    });
    await expect(page.locator(ROW).first()).toBeVisible({ timeout: TABLE_TIMEOUT });
  });
});
