/**
 * 用户页省市区级联选择器 E2E（对齐 MVC _Area2/_Area4）
 *
 * 覆盖：搜索区「地区」级联控件存在、选省加载市、搜索请求携带 AreaId、
 * 编辑表单「地区」为级联（非数字输入）且可展开选择。
 * 后端 UserController：SearchFields AreaId ItemType=area3、表单 AreaId ItemType=area4。
 *
 * ⚠️ 本文件会改写账号级 ReactSetting.areaPickerStyle，与 config.spec / react-setting.spec 存在配置冲突；
 * 从 `./utils/accountLock` 导入 test 后三条 spec 自动串行（跨 worker 文件锁），无需 `--workers=1`。
 */
import { expect, test } from './utils/accountLock';

const TABLE_TIMEOUT = 15000;
const ROW = '.ant-table-tbody tr.ant-table-row';

/** 按标签文本定位搜索区字段所在项，再取控件 */
function searchCell(page: import('@playwright/test').Page, label: string) {
  return page.locator('.cube-search-item', { hasText: label }).first();
}

/**
 * 展开搜索区。
 *
 * Cube 6.16 起 `/meta` 额外下发主时间区间项（`kind=range` 的 dtStart，占 2 列），
 * 用户页搜索项变多后「地区」可能被折叠在「展开」之后，断言前需先展开。
 */
async function ensureSearchExpanded(page: import('@playwright/test').Page) {
  const expand = page.getByRole('button', { name: /展\s*开/ });
  if (await expand.isVisible().catch(() => false)) await expand.click();
}

/** 按标签文本定位表单字段所在单元格，再取控件 */
function fieldCell(page: import('@playwright/test').Page, label: string) {
  return page.locator('.ant-modal').locator('.cube-form-inline-cell', { hasText: label }).first();
}

/**
 * 关闭残留浮层后再提交搜索
 *
 * antd 级联在 changeOnSelect 下选完中间级仍保持展开，tabs 面板也多为点外关闭；
 * 直接点「搜索」时第一击会被「点外关闭」逻辑吞掉，表现为搜索未提交、waiter 超时
 * （并发负载越大越容易踩中）。这里先 Esc 并等待浮层消失，再点搜索。
 */
async function closeOverlays(page: import('@playwright/test').Page) {
  await page.keyboard.press('Escape');
  await expect(page.locator('.ant-cascader-dropdown:visible')).toHaveCount(0, { timeout: 5000 });
  await expect(page.locator('.ant-drawer:visible, .ant-popover:visible')).toHaveCount(0, { timeout: 5000 });
}

/**
 * 通过 API 写入 ReactSetting.areaPickerStyle（改配置后需整页导航重置前端 store 缓存）。
 * 参考 react-setting.spec 的配置写入方式：GET /api/Admin/React 合并后 PUT，字段用 PascalCase（后端属性名）。
 */
async function setAreaPickerStyle(page: import('@playwright/test').Page, style: string) {
  await page.goto('/Admin/React');
  await page.waitForTimeout(600);
  await page.evaluate(async (s) => {
    const t = localStorage.getItem('token') || '';
    const headers = { Authorization: 'Bearer ' + t, 'Content-Type': 'application/json' };
    const getRes = await fetch('/api/Admin/React', { headers });
    const cur = (await getRes.json()).data ?? {};
    const body = {
      FormStyle: cur.formStyle ?? 'inline',
      DescMode: cur.descMode ?? 1,
      InputClear: cur.inputClear ?? false,
      AreaPickerStyle: s,
    };
    await fetch('/api/Admin/React', { method: 'PUT', headers, body: JSON.stringify(body) });
  }, style);
}

test.describe('用户页省市区级联选择器（/Admin/User）', () => {
  // 每个用例前确保 cascader 方案（tabs 用例内部再切换并恢复），避免配置残留互相影响
  test.beforeEach(async ({ page }) => {
    await setAreaPickerStyle(page, 'cascader');
  });

  test('搜索区出现「地区」级联，选省→市→搜索携带 AreaId', async ({ page }) => {
    await page.goto('/Admin/User');
    await page.waitForSelector(ROW, { timeout: TABLE_TIMEOUT });
    await ensureSearchExpanded(page);

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

    // 先关掉仍展开的级联浮层，避免首次点击搜索被「点外关闭」吞掉（并发下偶发未提交）
    await closeOverlays(page);

    // 点击搜索，断言列表请求携带 AreaId=<数值>（waitForRequest 避免请求早于监听注册导致的竞态）
    const [listReq] = await Promise.all([
      page.waitForRequest(
        (r) => r.url().includes('/api/Admin/User') && r.method() === 'GET' && /[?&]AreaId=\d+/.test(r.url()),
        { timeout: 15000 },
      ),
      page.getByRole('button', { name: /搜\s*索/ }).click(),
    ]);
    expect(listReq.url(), '搜索请求应携带 AreaId').toMatch(/[?&]AreaId=\d+/);
    // 搜索后列表仍正常渲染
    await expect(page.locator(ROW).first()).toBeVisible({ timeout: TABLE_TIMEOUT });
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

  test('tabs 方案：多Tab弹层按大区分组，选省→市→区搜索携带 AreaId', async ({ page }) => {
    await setAreaPickerStyle(page, 'tabs');
    try {
      await page.goto('/Admin/User');
      await page.waitForSelector(ROW, { timeout: TABLE_TIMEOUT });
      await ensureSearchExpanded(page);

      // tabs 方案：地区控件为只读文本框（非 .ant-cascader 级联下拉）
      const areaItem = searchCell(page, '地区');
      const areaInput = areaItem.locator('input[readonly]').first();
      await expect(areaInput).toBeVisible();

      // 打开面板：省份 tab + 大区分组（华北/华南…）
      await areaInput.click();
      const panel = page.locator('.ant-drawer:visible, .ant-popover:visible').first();
      await expect(panel.getByTestId('area-tabs-nav-0')).toHaveText('省份');
      await expect(panel.getByText('华北').first()).toBeVisible({ timeout: 8000 });

      // 选省 → 自动切城市 tab 并加载市
      await panel.locator('[data-testid="area-tabs-item"]', { hasText: '广东' }).first().click();
      await expect(panel.getByTestId('area-tabs-nav-1')).toBeVisible();
      await expect(panel.getByText('广州').first()).toBeVisible({ timeout: 8000 });

      // 选市 → 切区县 tab → 选第一个区
      await panel.locator('[data-testid="area-tabs-item"]', { hasText: '广州' }).first().click();
      await expect(panel.getByTestId('area-tabs-nav-2')).toBeVisible();
      const district = panel.getByTestId('area-tabs-item').first();
      await expect(district).toBeVisible({ timeout: 8000 });
      await district.click();

      // 先关掉可能仍展开的选择面板，避免首次点击搜索被「点外关闭」吞掉
      await closeOverlays(page);

      // 点击搜索，断言列表请求携带 AreaId=<数值>（waitForRequest 避免请求早于监听注册导致的竞态）
      const [listReq] = await Promise.all([
        page.waitForRequest(
          (r) => r.url().includes('/api/Admin/User') && r.method() === 'GET' && /[?&]AreaId=\d+/.test(r.url()),
          { timeout: 15000 },
        ),
        page.getByRole('button', { name: /搜\s*索/ }).click(),
      ]);
      expect(listReq.url(), '搜索请求应携带 AreaId').toMatch(/[?&]AreaId=\d+/);
    } finally {
      await setAreaPickerStyle(page, 'cascader');
    }
  });
});
