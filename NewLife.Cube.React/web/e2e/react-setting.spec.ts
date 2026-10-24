/**
 * React 皮肤设置 E2E（ReactSetting + ReactController + ConfigNav）
 *
 * 验证：
 * - 配置导航恒为平铺（基本设置…React设置…访问规则，无"更多配置"下拉）
 * - 切换表单风格为 vertical 后，实体编辑表单变为"标签一行控件一行"（保存自动刷新）
 * - 文本框清除图标（InputClear）开启/关闭时的自定义清除图标（.cube-input-clear，聚焦且非空才显示）
 * - 均会还原为默认值（inline / 关闭清除），避免影响其它用例
 */
import { expect, test, type Page } from '@playwright/test';

const ROW = '.ant-table-tbody tr.ant-table-row';
const TABLE_TIMEOUT = 15000;

/**
 * 用 API 直接更新 React 皮肤配置（幂等：GET 当前值合并 patch 后 PUT）。
 *
 * 规避 ConfigPage switch 点击后 Form 值异步同步的时序问题（曾偶发提交旧值导致导航排开切换失败）；
 * 改配置后需 reload 重置 useReactSetting store 缓存，否则同页后续访问读到旧值。
 * 先导航到同源页面再 evaluate（about:blank 读取 localStorage 会抛 SecurityError）。
 */
async function setReactConfig(page: Page, patch: Record<string, unknown>) {
  await page.goto('/Admin/React');
  await page.evaluate(async (patch) => {
    const t = localStorage.getItem('token') || '';
    const headers = { Authorization: 'Bearer ' + t, 'Content-Type': 'application/json' };
    const getRes = await fetch('/api/Admin/React', { headers });
    const cur = (await getRes.json()).data ?? {};
    const body = {
      FormStyle: cur.formStyle ?? 'inline',
      DescMode: cur.descMode ?? 1,
      InputClear: cur.inputClear ?? false,
      ...patch,
    };
    await fetch('/api/Admin/React', { method: 'PUT', headers, body: JSON.stringify(body) });
  }, patch);
  // reload 重置 useReactSetting store 缓存，使后续页面读到新配置
  await page.reload();
}

/** 配置导航全部项（一字排开时应全部可见） */
const NAV_ALL = [
  '基本设置',
  '系统设置',
  '星尘设置',
  '数据中间件',
  '魔方设置',
  'React设置',
  '短信设置',
  '邮件设置',
  'OAuth设置',
  '访问规则',
];

test.describe('React 皮肤设置（/Admin/React）', () => {
  test('配置导航恒为平铺：全部配置页可见且无下拉', async ({ page }) => {
    await page.goto('/Admin/Cube');
    const nav = page.locator('.cube-config-nav');
    for (const label of NAV_ALL) {
      await expect(nav.getByText(label, { exact: true }).first()).toBeVisible();
    }
    await expect(nav.getByText(/更多配置/)).toHaveCount(0);
  });

  test('切换表单风格为 vertical 后编辑表单标签一行控件一行（保存自动刷新）', async ({ page }) => {
    // 1. 打开 React 设置页，表单风格在当前值中可见
    await page.goto('/Admin/React');
    await expect(page.locator('.cube-config-row', { hasText: '表单风格' })).toBeVisible({ timeout: 8000 });
    await expect(page.getByText('表单', { exact: true }).first()).toBeVisible();

    // 2. 通过 API 改为 vertical（配置页下拉交互有动画时序，写值走 API 更稳；已有 config.spec 覆盖表单渲染）
    await setReactConfig(page, { FormStyle: 'vertical' });
    await expect(page.locator('.cube-config-row', { hasText: '表单风格' })).toContainText('vertical', { timeout: 10000 });

    // 3. 打开用户编辑表单：vertical 风格（标签一行 + 控件一行），无 inline 三栏
    await page.goto('/Admin/User');
    await page.waitForSelector(ROW, { timeout: TABLE_TIMEOUT });
    await page.locator(ROW).first().locator('.cube-op-btn-op-edit').click();
    await expect(page.locator('.ant-modal').locator('.cube-form-vertical-item').first()).toBeVisible({ timeout: 8000 });
    await expect(page.locator('.ant-modal').locator('.cube-form-inline-cell')).toHaveCount(0);
    await expect(page.locator('.ant-modal').locator('.ant-form-item-label').first()).toBeVisible();
    await page.locator('.ant-modal button', { hasText: /取\s*消/ }).first().click();

    // 4. API 还原为 inline（避免影响其它测试）
    await setReactConfig(page, { FormStyle: 'inline' });
    await page.goto('/Admin/React');
    await expect(page.locator('.cube-config-row', { hasText: '表单风格' })).toContainText('inline', { timeout: 10000 });
  });

  test('文本框清除图标开关：开启后聚焦且非空时显示清除图标', async ({ page }) => {
    // 1. 开启清除图标：聚焦且有值时显示自定义清除图标（.cube-input-clear）
    await setReactConfig(page, { InputClear: true });
    await page.goto('/Admin/User');
    await page.waitForSelector(ROW, { timeout: TABLE_TIMEOUT });
    await page.locator(ROW).first().locator('.cube-op-btn-op-edit').click();
    const nameInput = page.locator('.ant-modal input[placeholder="名称"]');
    await expect(nameInput).toBeVisible({ timeout: 8000 });
    await nameInput.fill('abc');
    await nameInput.focus();
    await expect(page.locator('.ant-modal .cube-input-clear').first()).toBeVisible({ timeout: 8000 });

    // 2. 关闭清除图标：聚焦且有值也不显示
    await page.locator('.ant-modal button', { hasText: /取\s*消/ }).first().click();
    await setReactConfig(page, { InputClear: false });
    await page.goto('/Admin/User');
    await page.waitForSelector(ROW, { timeout: TABLE_TIMEOUT });
    await page.locator(ROW).first().locator('.cube-op-btn-op-edit').click();
    const input2 = page.locator('.ant-modal input[placeholder="名称"]');
    await expect(input2).toBeVisible({ timeout: 8000 });
    await input2.fill('abc');
    await input2.focus();
    expect(await page.locator('.ant-modal .cube-input-clear').count()).toBe(0);
    await page.locator('.ant-modal button', { hasText: /取\s*消/ }).first().click();
  });
});
