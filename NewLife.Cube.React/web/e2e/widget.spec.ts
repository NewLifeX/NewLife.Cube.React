/**
 * 工作台卡片三能力 E2E（WIDGET-1：拖动排序 / 即时保存 / 隐藏）
 *
 * 覆盖：内容卡隐藏/恢复、KPI 指标卡隐藏/恢复、指针式拖拽排序并刷新保持。
 * 隐藏/排序操作即时保存服务端（对齐 MVC HideWidget/SaveOrder），无需手动保存按钮。
 * 以首页 / 为例。
 *
 * ⚠️ 并发约束：本文件与 home.spec.ts 共享同一登录用户的工作台布局状态（Parameter 按用户持久化），
 * 从 `./utils/accountLock` 导入 test 后两者自动串行（跨 worker 文件锁），无需再手动 `--workers=1`。
 */
import { expect, test } from './utils/accountLock';

test.describe('工作台卡片（卡片三能力）', () => {
  /** 重置布局并确认（清理测试残留）：工具栏「重置布局」已移除，恢复默认布局入口在已隐藏面板底部、
   *  无隐藏时不可达 → 直接调服务端接口（对齐 MVC resetLayout） */
  async function resetLayout(page: import('@playwright/test').Page) {
    await page.evaluate(async () => {
      const token = localStorage.getItem('token') ?? '';
      await fetch('/api/Admin/Index/ResetWidgetLayout', { method: 'POST', headers: { Authorization: `Bearer ${token}` } });
    });
    await page.waitForTimeout(400);
  }

  // 每个用例结束后重置布局：即使用例失败也恢复默认布局，避免隐藏残留污染后续用例/重试/下次运行
  // （home.spec 与 widget.spec 共享同一登录用户的工作台布局状态）
  test.afterEach(async ({ page }) => {
    await resetLayout(page).catch(() => {});
  });

  /** 隐藏指定内容卡片：点击卡片头「⋯」→ 隐藏卡片 */
  async function hideWidget(page: import('@playwright/test').Page, title: string) {
    const card = page.locator('.cube-home-widget', { hasText: title }).first();
    await card.locator('.ant-card-head .ant-btn').first().click();
    await page.locator('.ant-dropdown:visible').getByText('隐藏卡片').click();
  }

  /** 恢复指定卡片：点横幅「已隐藏 N」→ 恢复面板 → 该卡「恢复」按钮（对齐 MVC btn-widget-hidden + wb-hidden-pop） */
  async function restoreWidget(page: import('@playwright/test').Page, title: string) {
    await page.getByRole('button', { name: /已隐藏 \d+/ }).click();
    await page
      .locator('.cube-hidden-pop-item', { hasText: title })
      .getByRole('button', { name: /恢\s*复/ })
      .click();
  }

  /** 等待工作台加载完成（内容部件出现） */
  async function waitHome(page: import('@playwright/test').Page) {
    await expect(page.locator('.cube-home-grid .cube-home-widget').first()).toBeVisible({ timeout: 10000 });
  }

  test('隐藏内容卡片后消失，恢复后重现', async ({ page }) => {
    await page.goto('/');
    await waitHome(page);

    // 隐藏「快捷入口」卡片（即时保存服务端）
    await hideWidget(page, '快捷入口');
    await expect(page.locator('.cube-home-widget', { hasText: '快捷入口' })).toHaveCount(0);

    // 恢复卡片（即时保存回显）
    await restoreWidget(page, '快捷入口');
    await expect(page.locator('.cube-home-widget', { hasText: '快捷入口' }).first()).toBeVisible({ timeout: 8000 });

    await resetLayout(page);
  });

  test('KPI 指标卡可隐藏与恢复', async ({ page }) => {
    await page.goto('/');
    // 必须先等工作台内容部件出现（dashboard 聚合接口返回），否则首屏只有降级 KPI（在线状态/我的角色），
    // 等真实 KPI 到达后降级卡消失，隐藏记录就对不上恢复面板
    await waitHome(page);
    const kpi = page.locator('.cube-home-grid > .cube-home-kpi-card').first();
    await expect(kpi).toBeVisible({ timeout: 10000 });
    const label = (await kpi.locator('.cube-home-kpi-label').first().innerText()).trim();

    // 点 KPI 卡右上角 ⋯ → 隐藏
    await kpi.locator('.cube-home-kpi-actions .ant-btn').first().click();
    await page.locator('.ant-dropdown:visible').getByText('隐藏', { exact: true }).click();
    await expect(page.locator('.cube-home-grid > .cube-home-kpi-card', { hasText: label })).toHaveCount(0);

    // 恢复：横幅「已隐藏 N」→ 指标小卡分组
    await restoreWidget(page, label);
    await expect(page.locator('.cube-home-grid > .cube-home-kpi-card', { hasText: label }).first()).toBeVisible({ timeout: 8000 });

    await resetLayout(page);
  });

  test('隐藏卡片后刷新保持（自动保存服务端）', async ({ page }) => {
    await page.goto('/');
    await waitHome(page);

    // 隐藏「快捷入口」→ 即时保存，无需手动保存按钮
    await hideWidget(page, '快捷入口');
    await expect(page.locator('.cube-home-widget', { hasText: '快捷入口' })).toHaveCount(0);

    // 刷新后仍保持隐藏
    await page.reload();
    await waitHome(page);
    await expect(page.locator('.cube-home-widget', { hasText: '快捷入口' })).toHaveCount(0);

    await resetLayout(page);
  });

  test('KPI 卡指针式拖拽排序并刷新保持（自动保存）', async ({ page }) => {
    await page.goto('/');
    const kpiCards = page.locator('.cube-home-grid > .cube-home-kpi-card');
    await expect(kpiCards.first()).toBeVisible({ timeout: 10000 });

    const before = await kpiCards.evaluateAll((els) =>
      els.map((c) => c.querySelector('.cube-home-kpi-label')?.textContent?.trim()),
    );
    if (before.length < 3) return; // 卡不足跳过

    // 指针式拖拽：第一个 KPI 卡拖到第三个
    const handle = kpiCards.first().locator('.cube-kpi-drag-handle');
    const target = kpiCards.nth(2);
    const hb = await handle.boundingBox();
    const tb = await target.boundingBox();
    if (!hb || !tb) return; // 元素不可见跳过
    await page.mouse.move(hb.x + hb.width / 2, hb.y + hb.height / 2);
    await page.mouse.down();
    await page.waitForTimeout(50);
    await page.mouse.move(tb.x + tb.width / 2, tb.y + tb.height / 2, { steps: 10 });
    await page.mouse.up();

    // 组内顺序变化
    await expect
      .poll(async () =>
        page
          .locator('.cube-home-grid > .cube-home-kpi-card')
          .evaluateAll((els) => els.map((c) => c.querySelector('.cube-home-kpi-label')?.textContent?.trim())),
      )
      .not.toEqual(before);

    // 刷新后仍保持新顺序（即时保存服务端）
    await page.reload();
    await expect(page.locator('.cube-home-grid > .cube-home-kpi-card').first()).toBeVisible({ timeout: 10000 });
    const after = await page
      .locator('.cube-home-grid > .cube-home-kpi-card')
      .evaluateAll((els) => els.map((c) => c.querySelector('.cube-home-kpi-label')?.textContent?.trim()));
    expect(after).not.toEqual(before);

    await resetLayout(page);
  });
});
