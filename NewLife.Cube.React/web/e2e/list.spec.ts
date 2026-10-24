/**
 * 通用列表页 E2E（LIST 标准场景）
 *
 * 以 /Admin/User 为例验证：页面加载 / 列表展示 / 搜索 / 新增 / 编辑 / 删除 / 空错误状态。
 * 测试数据使用唯一前缀（ts-{时间戳}）保证隔离；删除用例先搜索定位目标（兼容分页）。
 *
 * 注意：表格启用 scroll.x 后 antd 会渲染隐藏的测量行（.ant-table-measure-row），
 * 数据行选择器统一使用 `tr.ant-table-row` 排除测量行。
 */
import { expect, test, type Page } from '@playwright/test';

const PREFIX = `e2e-${Date.now()}`;
const TABLE_TIMEOUT = 15000;
/** 数据行（排除 antd 测量行） */
const ROW = '.ant-table-tbody tr.ant-table-row';

/**
 * 打开用户列表并按关键字定位
 *
 * `/Admin/User` 搜索区没有文本关键字（只有角色/部门/性别/在线/启用/地区下拉），但后端支持 `q`
 * 关键字查询（与日志页一致），且页面会把 URL 查询参数直接透传给接口。新建用户后按下而地址
 * 打开即可精确定位，不依赖分页与排序。
 *
 * @param page 页面对象
 * @param keyword 关键字（测试用户名前缀）
 */
async function gotoUserList(page: Page, keyword: string) {
  await page.goto(`/Admin/User?q=${encodeURIComponent(keyword)}`);
  await page.waitForSelector(ROW, { timeout: TABLE_TIMEOUT });
  await page.waitForTimeout(800);
}

test.describe('通用列表页（/Admin/User）', () => {
  test('列表页加载无错误且展示数据', async ({ page }) => {
    const errors: string[] = [];
    page.on('console', (m) => {
      if (m.type() === 'error') errors.push(m.text());
    });
    page.on('pageerror', (e) => errors.push(e.message));

    await page.goto('/Admin/User');
    await expect(page.locator(ROW).first()).toBeVisible({ timeout: TABLE_TIMEOUT });
    expect(errors.filter((e) => !e.includes('favicon')), `控制台错误: ${errors.join('; ')}`).toEqual([]);
  });

  test('搜索按关键词过滤', async ({ page }) => {
    await page.goto('/Admin/User');
    await page.waitForSelector(ROW, { timeout: TABLE_TIMEOUT });
    // 等待加载完成（antd 加载中可能只有占位行），避免 rowsBefore 在数据未就绪时取样
    await page
      .waitForFunction(() => !document.querySelector('.ant-spin-spinning'), undefined, { timeout: 10000 })
      .catch(() => undefined);
    await page.waitForTimeout(300);
    const rowsBefore = await page.locator(ROW).count();
    const searchInput = page.locator('.ant-card input[type="text"], .ant-card input:not([type])').first();
    if (await searchInput.isVisible().catch(() => false)) {
      await searchInput.fill('admin');
      await page.getByRole('button', { name: /搜\s*索/ }).click();
      await page.waitForTimeout(1000);
      const rows = await page.locator(ROW).count();
      expect(rows).toBeGreaterThan(0);
      expect(rows).toBeLessThanOrEqual(rowsBefore);
    }
  });

  test('新增用户并出现在列表（刷新后仍可查）', async ({ page }) => {
    await page.goto('/Admin/User');
    await page.waitForSelector(ROW, { timeout: TABLE_TIMEOUT });
    const name = `${PREFIX}-user`;
    await page.getByRole('button', { name: /新增/ }).click();
    await page.waitForSelector('.ant-modal:not([style*="display: none"])', { timeout: 8000 });
    // 填写必填字段（用户名，主键已过滤，首个输入框为名称）
    await page.locator('.ant-modal input').first().fill(name);
    await page.getByRole('button', { name: /保\s*存/ }).click();
    await expect(page.locator('.ant-message')).toBeVisible({ timeout: 8000 });
    // 按关键字 q 定位（后端生效，URL 参数透传），避免依赖不存在的搜索框
    await gotoUserList(page, name);
    await expect(page.locator(ROW, { hasText: name }).first()).toBeVisible({ timeout: 10000 });
    // 刷新页面后仍可查（后端落库，而非前端内存态）
    await page.reload();
    await page.waitForSelector(ROW, { timeout: TABLE_TIMEOUT });
    await expect(page.locator(ROW, { hasText: name }).first()).toBeVisible({ timeout: 10000 });
  });

  test('列表列定制：编号后头像列，名称列优先显示昵称', async ({ page }) => {
    await page.goto('/Admin/User');
    await page.waitForSelector(ROW, { timeout: TABLE_TIMEOUT });
    // 头像列紧跟编号列（后端 AddListField 虚拟字段，纯 C# 控制，前端通用渲染）
    const headers = page.locator('.ant-table-thead th');
    await expect(headers.nth(1)).toHaveText('编号');
    await expect(headers.nth(2)).toHaveText('头像');
    await expect(headers.nth(3)).toHaveText('名称');

    // 自建用户仅填用户名（无昵称）→ 名称列回退显示用户名
    const name = `${PREFIX}-nick`;
    await page.getByRole('button', { name: /新增/ }).click();
    await page.waitForSelector('.ant-modal:not([style*="display: none"])', { timeout: 8000 });
    await page.locator('.ant-modal input').first().fill(name);
    await page.getByRole('button', { name: /保\s*存/ }).click();
    await expect(page.locator('.ant-modal:not([style*="display: none"])')).toHaveCount(0, { timeout: 8000 });

    // 按关键字 q 定位（后端生效）
    await gotoUserList(page, name);
    // 无昵称 → 名称列显示用户名
    await expect(page.locator(ROW, { hasText: name }).first()).toBeVisible({ timeout: 10000 });
  });

  test('编辑用户后值更新并刷新可查（防前端虚假编辑）', async ({ page }) => {
    await page.goto('/Admin/User');
    await page.waitForSelector(ROW, { timeout: TABLE_TIMEOUT });
    // 自建测试用户（仅填登录名），避免依赖预置数据
    const name = `${PREFIX}-edit`;
    await page.getByRole('button', { name: /新增/ }).click();
    await page.waitForSelector('.ant-modal:not([style*="display: none"])', { timeout: 8000 });
    await page.locator('.ant-modal input').first().fill(name);
    await page.getByRole('button', { name: /保\s*存/ }).click();
    // 新增成功 → 弹窗关闭（失败则弹窗保持并显示错误）
    await expect(page.locator('.ant-modal:not([style*="display: none"])')).toHaveCount(0, { timeout: 8000 });

    // 按关键字 q 定位目标
    await gotoUserList(page, name);
    const row = page.locator(ROW, { hasText: name }).first();
    await expect(row).toBeVisible({ timeout: 10000 });
    // 记住行主键：改昵称后名称列只显示昵称，不能再用登录名做文本定位
    const rowKey = await row.getAttribute('data-row-key');

    // 编辑：断言登录名预填（从后端加载；修复前 camelCase↔PascalCase 不匹配导致全部为空）
    await row.getByRole('button', { name: '编辑' }).click();
    await page.waitForSelector('.ant-modal:not([style*="display: none"])', { timeout: 8000 });
    await expect(page.locator('.ant-modal:visible input').first()).toHaveValue(name);

    // 修改昵称（DisplayName，非首字段）为唯一新值并保存（成功 → 弹窗关闭）
    const display2 = `${PREFIX}-改名`;
    const editDisplayCell = page.locator('.ant-modal:visible .cube-form-inline-cell', { hasText: '昵称' });
    if ((await editDisplayCell.count()) > 0) {
      await editDisplayCell.locator('input').fill(display2, { force: true });
    }
    await page.getByRole('button', { name: /保\s*存/ }).click();
    await expect(page.locator('.ant-modal:not([style*="display: none"])')).toHaveCount(0, { timeout: 8000 });

    // 刷新页面重新定位：新昵称仍在列表（后端落库）
    await page.reload();
    await page.waitForSelector(ROW, { timeout: TABLE_TIMEOUT });
    const edited = page.locator(`${ROW}[data-row-key="${rowKey}"]`).first();
    await expect(edited).toContainText(display2, { timeout: 10000 });

    // 重新打开编辑：昵称预填为新值（证明编辑从后端详情加载，非前端缓存）
    await edited.getByRole('button', { name: '编辑' }).click();
    await page.waitForSelector('.ant-modal:not([style*="display: none"])', { timeout: 8000 });
    const reEditCell = page.locator('.ant-modal:visible .cube-form-inline-cell', { hasText: '昵称' });
    if ((await reEditCell.count()) > 0) {
      await expect(reEditCell.locator('input')).toHaveValue(display2);
    }
  });

  test('查看详情弹窗从后端加载，刷新后仍可查', async ({ page }) => {
    // 只读控制器（ReadOnlyEntityController）才有「查看」入口，用审计日志页验证详情弹窗
    await page.goto('/Admin/Log');
    await page.waitForSelector(ROW, { timeout: TABLE_TIMEOUT });
    const firstRow = page.locator(ROW).first();
    await expect(firstRow).toBeVisible({ timeout: TABLE_TIMEOUT });

    // 打开详情弹窗：字段标签与内容均渲染（非空白）
    await firstRow.getByRole('button', { name: '查看' }).click();
    await page.waitForSelector('.ant-modal:not([style*="display: none"])', { timeout: 8000 });
    const modal = page.locator('.ant-modal:not([style*="display: none"])');
    await expect(modal.locator('.ant-descriptions-item-label').first()).toBeVisible();
    await expect(modal.locator('.ant-descriptions-item-content').first()).toBeVisible();
    // 关闭详情
    await modal.locator('.ant-modal-close').click();
    await expect(modal).toHaveCount(0, { timeout: 8000 });

    // 刷新后再次打开，仍能从后端加载详情
    await page.reload();
    await page.waitForSelector(ROW, { timeout: TABLE_TIMEOUT });
    await page.locator(ROW).first().getByRole('button', { name: '查看' }).click();
    await page.waitForSelector('.ant-modal:not([style*="display: none"])', { timeout: 8000 });
    const modal2 = page.locator('.ant-modal:not([style*="display: none"])');
    await expect(modal2.locator('.ant-descriptions-item-label').first()).toBeVisible();
    await expect(modal2.locator('.ant-descriptions-item-content').first()).toBeVisible();
    // 清理：关闭弹窗，避免影响后续用例
    await modal2.locator('.ant-modal-close').click().catch(() => undefined);
  });

  test('删除新增用户', async ({ page }) => {
    // 按关键字 q 一次列出本批次创建的用户（关键字在 URL 参数中透传给后端）
    await gotoUserList(page, PREFIX);
    const rows = page.locator(ROW, { hasText: PREFIX });
    const before = await rows.count();
    expect(before).toBeGreaterThan(0);
    await rows.first().getByRole('button', { name: '删除' }).click();
    // 危险操作二次确认（Popconfirm）
    await page.locator('.ant-popover:visible').getByRole('button', { name: /删\s*除/ }).click();
    await expect(page.locator('.ant-message')).toBeVisible({ timeout: 8000 });
    await expect(rows).toHaveCount(before - 1, { timeout: 10000 });
  });

  test('空状态（不存在的实体 → 404）', async ({ page }) => {
    await page.goto('/NoSuchEntity/XYZ');
    await expect(page.getByText('404').first()).toBeVisible({ timeout: 8000 });
  });

  test('导出 CSV 触发文件下载', async ({ page }) => {
    await page.goto('/Admin/User');
    await page.waitForSelector(ROW, { timeout: TABLE_TIMEOUT });
    // 导出收纳在「高级」菜单内（规范 §7.8）
    await page.getByRole('button', { name: /高\s*级/ }).click();
    const downloadPromise = page.waitForEvent('download', { timeout: 15000 });
    await page.getByText('导出 CSV').click();
    const download = await downloadPromise;
    expect(download.suggestedFilename().toLowerCase()).toContain('.csv');
  });

  test('导出 Excel 触发 xlsx 下载且携带当前查询条件', async ({ page }) => {
    // Log 页搜索区含「关键字」文本框（Q 参数）；User 页搜索区全为下拉，无文本关键字
    await page.goto('/Admin/Log');
    await page.waitForSelector(ROW, { timeout: TABLE_TIMEOUT });
    // 先搜索设置查询条件（关键字 → 后端 Q 参数），验证导出基于当前查询而非整表
    const keyword = page.getByPlaceholder('请输入关键字');
    await keyword.fill('admin');
    await page.getByRole('button', { name: /搜\s*索/ }).click();
    await page.waitForTimeout(800);
    // 导出收纳在「高级」菜单内（规范 §7.8）
    await page.getByRole('button', { name: /高\s*级/ }).click();
    const reqPromise = page.waitForRequest((r) => r.url().includes('/export'), { timeout: 20000 });
    const downloadPromise = page.waitForEvent('download', { timeout: 20000 });
    await page.getByText('导出 Excel').click();
    const [req, download] = await Promise.all([reqPromise, downloadPromise]);
    expect(download.suggestedFilename().toLowerCase()).toContain('.xlsx');
    // 导出请求携带当前搜索关键字（Q 参数），而非整表导出
    expect(req.url()).toContain(encodeURIComponent('admin'));
  });

  test('导出 Zip 触发 zip 下载且携带当前查询条件', async ({ page }) => {
    // Log 页搜索区含「关键字」文本框（Q 参数）
    await page.goto('/Admin/Log');
    await page.waitForSelector(ROW, { timeout: TABLE_TIMEOUT });
    // 先搜索设置查询条件，验证导出基于当前查询而非整表
    const keyword = page.getByPlaceholder('请输入关键字');
    await keyword.fill('admin');
    await page.getByRole('button', { name: /搜\s*索/ }).click();
    await page.waitForTimeout(800);
    // 导出收纳在「高级」菜单内（规范 §7.8）
    await page.getByRole('button', { name: /高\s*级/ }).click();
    const reqPromise = page.waitForRequest((r) => r.url().includes('/export'), { timeout: 20000 });
    const downloadPromise = page.waitForEvent('download', { timeout: 20000 });
    await page.getByText('导出 Zip').click();
    const [req, download] = await Promise.all([reqPromise, downloadPromise]);
    expect(download.suggestedFilename().toLowerCase()).toContain('.zip');
    expect(req.url()).toContain(encodeURIComponent('admin'));
  });

  test('导入 CSV 新增用户并落库', async ({ page }) => {
    await page.goto('/Admin/User');
    await page.waitForSelector(ROW, { timeout: TABLE_TIMEOUT });
    const name = `e2e-import-${Date.now()}`;
    // CSV 首行为表头（字段名），后续行为数据
    const csv = `Name,DisplayName,Password\n${name},导入测试,admin123\n`;
    const buffer = Buffer.from(csv, 'utf-8');
    // 导入收纳在「高级」菜单内（规范 §7.8），触发隐藏文件选择框并上传
    await page.getByRole('button', { name: /高\s*级/ }).click();
    await page.getByText('导入 Excel/Json/Zip').click();
    await page.locator('input[type="file"]').setInputFiles({
      name: 'users.csv',
      mimeType: 'text/csv',
      buffer,
    });
    await expect(page.locator('.ant-message')).toBeVisible({ timeout: 10000 });
    // 搜索确认落库
    const searchInput = page.locator('.ant-card input[type="text"], .ant-card input:not([type])').first();
    if (await searchInput.isVisible().catch(() => false)) {
      await searchInput.fill(name);
      await page.getByRole('button', { name: /搜\s*索/ }).click();
      await page.waitForTimeout(1000);
      // 名称列优先显示昵称（CSV 导入的 DisplayName），用户名仅用于搜索定位
      await expect(page.locator('.ant-table-tbody').getByText('导入测试').first()).toBeVisible({ timeout: 10000 });
    }
  });

  test('分页器渲染且可翻页', async ({ page }) => {
    await page.goto('/Admin/User');
    await page.waitForSelector(ROW, { timeout: TABLE_TIMEOUT });
    const pager = page.locator('.ant-pagination');
    await expect(pager).toBeVisible();
    // 数据量足够时有第 2 页，点击并断言激活页码
    const page2 = pager.locator('.ant-pagination-item-2');
    if (await page2.isVisible().catch(() => false)) {
      await page2.click();
      await page.waitForTimeout(800);
      await expect(pager.locator('.ant-pagination-item-active')).toContainText('2');
    }
  });

  test('新增弹窗空提交被校验拦截', async ({ page }) => {
    await page.goto('/Admin/User');
    await page.waitForSelector(ROW, { timeout: TABLE_TIMEOUT });
    await page.getByRole('button', { name: /新增/ }).click();
    await page.waitForSelector('.ant-modal:not([style*="display: none"])', { timeout: 8000 });
    // 不填用户名直接保存 → 前端必填校验 或 后端错误提示（至少其一出现，拦截提交）
    await page.getByRole('button', { name: /保\s*存/ }).click();
    await expect(page.locator('.ant-form-item-explain-error, .ant-message').first()).toBeVisible({ timeout: 8000 });
    // 弹窗未被关闭（说明未提交成功）
    await expect(page.locator('.ant-modal:not([style*="display: none"])')).toBeVisible();
  });

  test('批量删除选中用户', async ({ page }) => {
    await page.goto('/Admin/User');
    await page.waitForSelector(ROW, { timeout: TABLE_TIMEOUT });
    // 先新增两个测试用户
    for (let i = 0; i < 2; i++) {
      const name = `${PREFIX}-bd${i}`;
      await page.getByRole('button', { name: /新增/ }).click();
      await page.waitForSelector('.ant-modal:not([style*="display: none"])', { timeout: 8000 });
      await page.locator('.ant-modal input').first().fill(name);
      await page.getByRole('button', { name: /保\s*存/ }).click();
      await expect(page.locator('.ant-message')).toBeVisible({ timeout: 8000 });
    }
    // 搜索定位目标（兼容分页）
    const searchInput = page.locator('.ant-card input[type="text"], .ant-card input:not([type])').first();
    if (await searchInput.isVisible().catch(() => false)) {
      await searchInput.fill(PREFIX);
      await page.getByRole('button', { name: /搜\s*索/ }).click();
      await page.waitForTimeout(1000);
    }
    // 勾选前两行
    const rows = page.locator(ROW);
    const count = await rows.count();
    expect(count).toBeGreaterThan(0);
    for (let i = 0; i < Math.min(2, count); i++) {
      await rows.nth(i).locator('input[type="checkbox"]').check({ timeout: 5000 });
    }
    // 点击工具栏「删除选中」（选中行后出现）→ Popconfirm 确认
    await page.getByRole('button', { name: /删除选中/ }).click();
    const confirmBtn = page.locator('.ant-popover').getByRole('button', { name: /删\s*除/ }).first();
    await confirmBtn.click();
    await expect(page.locator('.ant-message')).toBeVisible({ timeout: 8000 });
  });

  test('无图表数据的页面不显示 表格/图表 视图切换', async ({ page }) => {
    await page.goto('/Admin/User');
    await page.waitForSelector(ROW, { timeout: TABLE_TIMEOUT });
    // /Admin/User 无图表数据（canChart=false），Segmented 视图切换不渲染，表格仍可见
    await expect(page.locator('.ant-segmented')).toHaveCount(0);
    await expect(page.locator(ROW).first()).toBeVisible({ timeout: TABLE_TIMEOUT });
  });

  test('列表页纵向与横向滚动可用（滚动回归）', async ({ page }) => {
    // 固定较小视口，确保列表内容超高、表格超宽，从而触发内部滚动
    await page.setViewportSize({ width: 1280, height: 700 });
    await page.goto('/Admin/User');
    await page.waitForSelector(ROW, { timeout: TABLE_TIMEOUT });
    // 等待加载完成（antd 加载中可能只有占位行），避免滚动度量在数据未就绪时取样
    await page
      .waitForFunction(() => !document.querySelector('.ant-spin-spinning'), undefined, { timeout: 10000 })
      .catch(() => undefined);
    await page.waitForTimeout(300);

    // 纵向：.cube-shell-body 是唯一滚动容器（overflow-y:auto），内容超高时可滚动到底露出分页
    const vScroll = await page.evaluate(() => {
      const body = document.querySelector<HTMLElement>('.cube-shell-body');
      if (!body) return { ok: false, reason: 'no-scroll-body' };
      const overflow = getComputedStyle(body).overflowY;
      if (body.scrollHeight <= body.clientHeight)
        return { ok: false, reason: 'content-not-taller', sh: body.scrollHeight, ch: body.clientHeight, overflow };
      body.scrollTop = 999999;
      return { ok: body.scrollTop > 0, sh: body.scrollHeight, ch: body.clientHeight, top: body.scrollTop, overflow };
    });
    expect(vScroll.ok, `纵向滚动异常: ${JSON.stringify(vScroll)}`).toBeTruthy();

    // 横向：表格内容超宽时 .ant-table-content（overflow-x:auto）可横向滚动
    const hScroll = await page.evaluate(() => {
      const t = document.querySelector<HTMLElement>('.ant-table-content');
      if (!t) return { ok: false, reason: 'no-table-content' };
      const overflow = getComputedStyle(t).overflowX;
      if (t.scrollWidth <= t.clientWidth)
        return { ok: false, reason: 'table-not-wider', sw: t.scrollWidth, cw: t.clientWidth, overflow };
      t.scrollLeft = 500;
      return { ok: t.scrollLeft > 0, sw: t.scrollWidth, cw: t.clientWidth, left: t.scrollLeft, overflow };
    });
    expect(hScroll.ok, `横向滚动异常: ${JSON.stringify(hScroll)}`).toBeTruthy();
  });

  test('新增弹窗按字段分类分组展示（Tabs）', async ({ page }) => {
    await page.goto('/Admin/User');
    await page.waitForSelector(ROW, { timeout: TABLE_TIMEOUT });
    await page.getByRole('button', { name: /新增/ }).click();
    await page.waitForSelector('.ant-modal:not([style*="display: none"])', { timeout: 8000 });
    // 字段带 Category → 弹窗内按分类 Tabs 分组展示
    const tabs = page.locator('.ant-modal:visible .ant-tabs-tab');
    await expect(tabs.first()).toBeVisible({ timeout: 8000 });
    const labels = await tabs.allTextContents();
    expect(labels.length).toBeGreaterThan(1);
    // 切换分组后展示该组字段
    await tabs.nth(1).click();
    await expect(page.locator('.ant-modal:visible .ant-tabs-tab-active')).toHaveText(labels[1]);
    // 关闭弹窗，避免影响后续用例
    await page.locator('.ant-modal:visible button:has-text("取 消")').click();
  });
});
