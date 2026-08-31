/**
 * 工作台卡片三能力 E2E（WIDGET-1：拖动排序 / 保存顺序 / 隐藏）
 *
 * 覆盖：内容卡隐藏/恢复、KPI 指标卡隐藏/恢复、保存布局并刷新保持，布局按用户持久化到服务端。
 * 以首页 / 为例。
 *
 * ⚠️ 并发约束：本文件与 home.spec.ts 共享同一登录用户的工作台布局状态（Parameter 按用户持久化），
 * 需 --workers=1 串行运行，否则并发下互相覆盖布局导致偶发失败（对齐 config/react-setting 的约束）：
 *   pnpm exec playwright test e2e/home.spec.ts e2e/widget.spec.ts --project=chromium --workers=1
 */
import { expect, test } from '@playwright/test';

test.describe('工作台卡片（卡片三能力）', () => {
  /** 隐藏指定内容卡片：点击卡片头「⋯」→ 隐藏卡片 */
  async function hideWidget(page: import('@playwright/test').Page, title: string) {
    const card = page.locator('.cube-home-widget', { hasText: title }).first();
    await card.locator('.ant-card-head .ant-btn').first().click();
    await page.locator('.ant-dropdown:visible').getByText('隐藏卡片').click();
  }

  /** 恢复指定卡片：点击「恢复卡片」→ 选择卡片名 */
  async function restoreWidget(page: import('@playwright/test').Page, title: string) {
    await page.getByRole('button', { name: /恢复卡片/ }).click();
    await page.locator('.ant-dropdown:visible').getByText(title, { exact: true }).click();
  }

  /** 等待工作台加载完成（内容部件出现） */
  async function waitHome(page: import('@playwright/test').Page) {
    await expect(page.locator('.cube-home-grid .cube-home-widget').first()).toBeVisible({ timeout: 10000 });
  }

  test('隐藏内容卡片后消失，恢复后重现', async ({ page }) => {
    await page.goto('/');
    await waitHome(page);

    // 隐藏「快捷入口」卡片
    await hideWidget(page, '快捷入口');
    await expect(page.locator('.cube-home-widget', { hasText: '快捷入口' })).toHaveCount(0);

    // 恢复卡片
    await restoreWidget(page, '快捷入口');
    await expect(page.locator('.cube-home-widget', { hasText: '快捷入口' }).first()).toBeVisible({ timeout: 8000 });
  });

  test('KPI 指标卡可隐藏与恢复', async ({ page }) => {
    await page.goto('/');
    const kpi = page.locator('.cube-home-grid > .cube-home-kpi-card').first();
    await expect(kpi).toBeVisible({ timeout: 10000 });
    const label = (await kpi.locator('.cube-home-kpi-label').first().innerText()).trim();

    // 点 KPI 卡右上角 ⋯ → 隐藏
    await kpi.locator('.cube-home-kpi-actions .ant-btn').first().click();
    await page.locator('.ant-dropdown:visible').getByText('隐藏', { exact: true }).click();
    await expect(page.locator('.cube-home-grid > .cube-home-kpi-card', { hasText: label })).toHaveCount(0);

    // 恢复：指标小卡分组
    await page.getByRole('button', { name: /恢复卡片/ }).click();
    await page.locator('.ant-dropdown:visible').getByText(label, { exact: true }).click();
    await expect(page.locator('.cube-home-grid > .cube-home-kpi-card', { hasText: label }).first()).toBeVisible({ timeout: 8000 });
  });

  test('保存布局后刷新保持', async ({ page }) => {
    await page.goto('/');
    await waitHome(page);

    // 隐藏「快捷入口」并保存
    await hideWidget(page, '快捷入口');
    await page.getByRole('button', { name: /保存布局/ }).click();
    await expect(page.locator('.ant-message').getByText('布局已保存')).toBeVisible({ timeout: 8000 });

    // 刷新后仍保持隐藏
    await page.reload();
    await waitHome(page);
    await expect(page.locator('.cube-home-widget', { hasText: '快捷入口' })).toHaveCount(0);

    // 清理：重置布局，避免影响其它用例
    await page.getByRole('button', { name: /重置布局/ }).click();
    await expect(page.locator('.ant-message').getByText('布局已重置')).toBeVisible({ timeout: 8000 });
  });
});
