/**
 * 角色权限配置 E2E（操作列「权限」弹窗，对齐 MVC 角色授权）
 *
 * 验证：
 * - 操作列权限按钮位置（编辑左侧）
 * - 弹窗默认仅显示一级菜单（折叠），展开后子菜单可见
 * - 单列动态「操作权限」：叶子行渲染全部权限位（含额外位，如 首页=查看+释放内存、数据库=查看+添加）
 * - 一级菜单 只读/全部/无权限 级联到当前+所有子孙，保存后重开保持（后端落库）
 *
 * 测试角色 e2e-{ts}-perm 用完即删，保证数据隔离。
 */
import { expect, test, type Locator, type Page } from '@playwright/test';

const PREFIX = `e2e-${Date.now()}`;
const ROW = '.ant-table-tbody tr.ant-table-row';
const MODAL = '.ant-modal';
const TABLE_TIMEOUT = 15000;

// ── 通用辅助 ─────────────────────────────────────────

/** 新增测试角色（工具栏新增 → 填名称 → 保存） */
async function createRole(page: Page, name: string) {
  await page.goto('/Admin/Role');
  await page.waitForSelector(ROW, { timeout: TABLE_TIMEOUT });
  await page.locator('.cube-toolbar').getByRole('button', { name: /新\s*增/ }).click();
  await expect(page.locator(MODAL)).toBeVisible({ timeout: 8000 });
  await page.locator(`${MODAL} input`).first().fill(name);
  await page.getByRole('button', { name: /保\s*存/ }).click();
  await expect(page.locator('.ant-message')).toBeVisible({ timeout: 8000 });
  await page.waitForTimeout(1200);
}

/** 打开指定角色的权限弹窗，返回弹窗容器 */
async function openPermDialog(page: Page, name: string): Promise<Locator> {
  const row = page.locator(ROW, { hasText: name }).first();
  await expect(row).toBeVisible({ timeout: TABLE_TIMEOUT });
  await row.locator('.cube-op-btn-op-perm').click();
  const modal = page.locator(MODAL);
  await expect(modal).toBeVisible({ timeout: 8000 });
  return modal;
}

/** 删除测试角色（Popconfirm 确认），不存在则跳过 */
async function deleteRole(page: Page, name: string) {
  const row = page.locator(ROW, { hasText: name }).first();
  if ((await row.count()) === 0) return;
  await row.locator('.cube-op-btn-op-delete').click();
  await page.waitForSelector('.ant-popconfirm:not([style*="display: none"])', { timeout: 8000 });
  await page.locator('.ant-popconfirm button').filter({ hasText: /删\s*除/ }).first().click();
  await page.waitForTimeout(1200);
  await expect(page.locator(ROW, { hasText: name })).toHaveCount(0);
}

/** 按菜单显示名定位权限弹窗内的树形行（displayName 唯一：首页/数据库/系统管理/应用日志） */
const rowByMenu = (modal: Locator, displayName: string) => modal.locator('tbody tr', { hasText: displayName });

/** 点击树形行展开箭头 */
async function expandRow(modal: Locator, displayName: string) {
  await rowByMenu(modal, displayName).locator('.ant-table-row-expand-icon').click();
}

/** 点击某菜单行的快捷授权（只读/全部/无权限） */
async function quickAction(modal: Locator, displayName: string, action: '只读' | '全部' | '无权限') {
  await rowByMenu(modal, displayName).locator('td').nth(1).getByText(action, { exact: true }).click();
}

/** 某菜单行的指定权限位复选框（按 label 定位） */
const checkbox = (modal: Locator, displayName: string, label: string) =>
  rowByMenu(modal, displayName).locator('.ant-checkbox-wrapper', { hasText: label }).locator('input[type=checkbox]');

/** 保存并等待成功提示 */
async function savePerm(page: Page, modal: Locator) {
  await modal.locator('button', { hasText: /保\s*存/ }).first().click();
  await expect(page.locator('.ant-message').getByText('权限保存成功')).toBeVisible({ timeout: 8000 });
}

test.describe('角色权限（/Admin/Role）', () => {
  test('操作列含「权限」按钮且位于编辑左侧', async ({ page }) => {
    await page.goto('/Admin/Role');
    await page.waitForSelector(ROW, { timeout: TABLE_TIMEOUT });

    const row = page.locator(ROW).first();
    const opBtns = row.locator('td:last-child button');
    await expect(opBtns.first()).toHaveText('权限');
    await expect(opBtns.nth(1)).toHaveText('编辑');
    await expect(opBtns.nth(2)).toHaveText('删除');
  });

  test('权限弹窗：默认仅显示一级菜单，叶子行动态渲染全部权限位（含额外位）', async ({ page }) => {
    const errors: string[] = [];
    page.on('console', (m) => {
      if (m.type() === 'error') errors.push(m.text());
    });
    page.on('pageerror', (e) => errors.push(e.message));

    const name = `${PREFIX}-perm1`;
    await createRole(page, name);
    const modal = await openPermDialog(page, name);

    // 表头：菜单 + 操作权限（单列动态，无 4 列权限列头）
    const headers = await modal.locator('th').allInnerTexts();
    expect(headers.join(',')).toContain('菜单');
    expect(headers.join(',')).toContain('操作权限');
    expect(headers.join(',').replace(/\s/g, '')).not.toContain('查看');
    expect(headers.join(',').replace(/\s/g, '')).not.toContain('删除');

    // 默认折叠：一级菜单可见，深层子菜单（应用日志）不可见
    await expect(rowByMenu(modal, '系统管理')).toBeVisible();
    await expect(rowByMenu(modal, '应用日志')).toHaveCount(0);

    // 展开系统管理：子菜单出现
    await expandRow(modal, '系统管理');
    await expect(rowByMenu(modal, '首页')).toBeVisible();

    // 动态权限列：首页 flags=1+16（查看+释放内存），数据库 flags=1+2（查看+添加）
    await expect(checkbox(modal, '首页', '查看')).toBeVisible();
    await expect(checkbox(modal, '首页', '释放内存')).toBeVisible();
    await expect(checkbox(modal, '数据库', '查看')).toBeVisible();
    await expect(checkbox(modal, '数据库', '添加')).toBeVisible();
    // 新角色未授权：全部未勾选
    await expect(checkbox(modal, '首页', '查看')).not.toBeChecked();
    await expect(checkbox(modal, '首页', '释放内存')).not.toBeChecked();

    expect(errors.filter((e) => !e.includes('favicon')), `控制台错误: ${errors.join('; ')}`).toEqual([]);

    // 清理
    await modal.locator('button', { hasText: /取\s*消/ }).first().click();
    await deleteRole(page, name);
  });

  test('一级菜单「只读」级联：子孙仅查看（含额外位不授予），保存后重开保持', async ({ page }) => {
    const name = `${PREFIX}-perm2`;
    await createRole(page, name);
    let modal = await openPermDialog(page, name);

    // 系统管理「只读」→ 当前+所有子孙授予查看(1)
    await quickAction(modal, '系统管理', '只读');
    await expandRow(modal, '系统管理');

    // 用户行：查看勾选、添加未勾选
    await expect(checkbox(modal, '首页', '查看')).toBeChecked();
    await expect(checkbox(modal, '首页', '释放内存')).not.toBeChecked();
    await expect(checkbox(modal, '数据库', '查看')).toBeChecked();
    await expect(checkbox(modal, '数据库', '添加')).not.toBeChecked();

    // 保存 → 后端落库
    await savePerm(page, modal);

    // 重开验证持久化（重新进入，非前端内存态）
    modal = await openPermDialog(page, name);
    await expandRow(modal, '系统管理');
    await expect(checkbox(modal, '首页', '查看')).toBeChecked();
    await expect(checkbox(modal, '首页', '释放内存')).not.toBeChecked();

    await modal.locator('button', { hasText: /取\s*消/ }).first().click();
    await deleteRole(page, name);
  });

  test('一级菜单「全部」级联：子孙全部权限位（含额外位），保存后重开保持', async ({ page }) => {
    const name = `${PREFIX}-perm3`;
    await createRole(page, name);
    let modal = await openPermDialog(page, name);

    // 系统管理「全部」→ 当前+所有子孙授予全部权限位（0xFFFFFFFF）
    await quickAction(modal, '系统管理', '全部');
    await expandRow(modal, '系统管理');

    // 用户行 4 权限位全勾选；首页含额外位（释放内存）也勾选；数据库 查看+添加 勾选
    await expect(checkbox(modal, '首页', '查看')).toBeChecked();
    await expect(checkbox(modal, '首页', '释放内存')).toBeChecked();
    await expect(checkbox(modal, '数据库', '查看')).toBeChecked();
    await expect(checkbox(modal, '数据库', '添加')).toBeChecked();

    await savePerm(page, modal);

    // 重开验证持久化
    modal = await openPermDialog(page, name);
    await expandRow(modal, '系统管理');
    await expect(checkbox(modal, '首页', '查看')).toBeChecked();
    await expect(checkbox(modal, '首页', '释放内存')).toBeChecked();
    await expect(checkbox(modal, '数据库', '添加')).toBeChecked();

    await modal.locator('button', { hasText: /取\s*消/ }).first().click();
    await deleteRole(page, name);
  });

  test('一级菜单「无权限」级联：子孙权限清空，保存后重开保持', async ({ page }) => {
    const name = `${PREFIX}-perm4`;
    await createRole(page, name);
    let modal = await openPermDialog(page, name);

    // 先「全部」再「无权限」→ 验证级联清空（新角色本身无权限，需先授予再清空才可观测）
    await quickAction(modal, '系统管理', '全部');
    await quickAction(modal, '系统管理', '无权限');
    await expandRow(modal, '系统管理');

    await expect(checkbox(modal, '首页', '查看')).not.toBeChecked();
    await expect(checkbox(modal, '首页', '释放内存')).not.toBeChecked();
    await expect(checkbox(modal, '数据库', '添加')).not.toBeChecked();

    await savePerm(page, modal);

    // 重开验证持久化
    modal = await openPermDialog(page, name);
    await expandRow(modal, '系统管理');
    await expect(checkbox(modal, '首页', '查看')).not.toBeChecked();
    await expect(checkbox(modal, '数据库', '添加')).not.toBeChecked();

    await modal.locator('button', { hasText: /取\s*消/ }).first().click();
    await deleteRole(page, name);
  });
});
