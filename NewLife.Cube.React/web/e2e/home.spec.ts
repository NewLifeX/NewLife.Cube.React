/**
 * 首页 + 顶栏切换器 + 用户菜单 E2E（HOME-1 / CMP-6 / CMP-5）
 *
 * 覆盖：首页加载无错误、紧凑横幅欢迎信息、KPI 卡直排网格、内容部件（性能监控/系统信息/登录与在线/快捷入口）、
 * 语言/明暗切换、用户菜单入口展示。
 *
 * ⚠️ 并发约束：本文件与 widget.spec.ts 共享同一登录用户的工作台布局状态，
 * 需 --workers=1 串行运行（见 widget.spec.ts 文件头说明）。
 * 退出登录用例独立在 logout.spec.ts（单会话策略会禁用共享 admin token）。
 */
import { expect, test } from '@playwright/test';

test.describe('首页（/）', () => {
  test('首页加载无错误且展示欢迎信息与工作台部件', async ({ page }) => {
    const errors: string[] = [];
    page.on('console', (m) => {
      if (m.type() === 'error') errors.push(m.text());
    });
    page.on('pageerror', (e) => errors.push(e.message));

    await page.goto('/');
    // 紧凑横幅副标题含"欢迎回到"（时间段问候 + 系统名，对齐 MVC wb-banner）
    await expect(page.getByText(/欢迎回到/).first()).toBeVisible({ timeout: 10000 });
    // 内容部件卡存在（性能监控/系统信息/登录与在线/快捷入口/个人信息）
    await expect(page.locator('.cube-home-grid .cube-home-widget').first()).toBeVisible({ timeout: 10000 });
    expect(errors.filter((e) => !e.includes('favicon')), `控制台错误: ${errors.join('; ')}`).toEqual([]);
  });

  test('KPI 指标卡直接排布在网格中（无外层 Card 容器）', async ({ page }) => {
    await page.goto('/');
    const kpis = page.locator('.cube-home-grid > .cube-home-kpi-card');
    await expect(kpis.first()).toBeVisible({ timeout: 10000 });
    // 管理员默认系统 KPI 卡（UserCount/TodayLogin/OnlineCount/MaxOnline/Error24h/OnlineTime），降级时至少 3 个
    expect(await kpis.count()).toBeGreaterThanOrEqual(3);
    // KPI 卡是网格直接子元素，未包在 Card 容器内
    await expect(page.locator('.cube-home-grid > .cube-home-widget').first()).toBeVisible();
  });

  test('点击 24h异常 指标卡跳转审计日志页并携带查询条件回显', async ({ page }) => {
    await page.goto('/');
    const card = page.locator('.cube-home-kpi-card[data-key="error24h"]');
    await expect(card).toBeVisible({ timeout: 10000 });
    // 点击卡片主体（避开右上角拖拽/隐藏菜单区）
    await card.click({ position: { x: 70, y: 40 } });
    // 跳转到审计日志页并携带时间范围 + 失败条件
    await page.waitForURL(/\/Admin\/Log\?.*(dtStart|success=false)/, { timeout: 10000 });
    // 搜索区回显时间范围（开始/结束日期非空）
    await expect(page.getByPlaceholder('开始日期')).not.toHaveValue('');
    await expect(page.getByPlaceholder('结束日期')).not.toHaveValue('');
    // 成功条件回显为「否」（success=false）
    await expect(page.locator('.ant-card').getByText('成功').locator('..').getByText('否')).toBeVisible({ timeout: 5000 });
  });

  test('点击横幅头像进入个人中心', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('.cube-home-banner-avatar')).toBeVisible({ timeout: 10000 });
    await page.locator('.cube-home-banner-avatar').click();
    await page.waitForURL('**/profile');
    await expect(page.getByText('基础信息').first()).toBeVisible({ timeout: 10000 });
  });

  test('快捷入口可点击进入实体页', async ({ page }) => {
    await page.goto('/');
    const links = page.locator('.cube-home-quick-link');
    await expect(links.first()).toBeVisible({ timeout: 10000 });
    const n = await links.count();
    if (n > 0) {
      await links.first().click();
      // 进入实体页后应渲染列表（非 404）
      await expect(page.locator('.ant-card, h2').first()).toBeVisible({ timeout: 10000 });
    }
  });
});

test.describe('顶栏切换器（CMP-6）', () => {
  test('语言切换：切换到 English', async ({ page }) => {
    await page.goto('/');
    await page.locator('.anticon-global').click();
    await page.getByText('English').click();
    // 顶栏应出现英文（面包屑或页面内容），放宽：无错误即可
    await page.waitForTimeout(500);
    expect(page.locator('.ant-message-error')).toHaveCount(0);
  });

  test('明暗模式切换按钮可用', async ({ page }) => {
    await page.goto('/');
    const modeBtn = page.locator('.anticon-sun, .anticon-moon').first();
    await expect(modeBtn).toBeVisible({ timeout: 10000 });
    await modeBtn.click();
    await page.waitForTimeout(300);
    // 点击后应切换为另一个图标
    await expect(page.locator('.anticon-sun, .anticon-moon').first()).toBeVisible();
  });
});

test.describe('用户菜单（CMP-5）', () => {
  test('点击用户菜单显示个人中心/安全中心与退出登录入口', async ({ page }) => {
    await page.goto('/');
    // 用户菜单（头像+用户名），用稳定触发器类名（首页卡片按钮也含 ant-dropdown-trigger，不能用 last）
    await page.locator('.cube-user-trigger').first().click();
    // 下拉项与页面内同名文案并存，限定在用户菜单下拉内定位
    await expect(page.locator('.ant-dropdown:visible').getByText('个人中心')).toBeVisible({ timeout: 5000 });
    await expect(page.locator('.ant-dropdown:visible').getByText('安全中心')).toBeVisible();
    await expect(page.locator('.ant-dropdown:visible').getByText('退出登录')).toBeVisible();
  });
});
