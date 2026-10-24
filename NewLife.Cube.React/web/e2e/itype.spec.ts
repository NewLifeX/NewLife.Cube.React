/**
 * ItemType 呈现能力 E2E（ITYPE-10）
 *
 * 验收对象：CubeDemo `/Test/TestField`（「字段类型测试」实体，25 字段覆盖全部 ItemType）。
 * - 列表：`image` 缩略图、`color` 色块、布尔标签、值集翻译按 ItemType 呈现；
 * - 表单：`image`/`file` 上传、`color` 取色器、`json`/`markdown` 文本域、`html` 富文本、
 *   值集（singleSelect/multipleSelect/lovTable/lovTableMulti/icon）下拉，且无 `area` 字段时不误判级联。
 *
 * 数据隔离：用例内通过 API 建一条唯一关键字记录，结束后删除，不依赖预置数据。
 */
import { expect, test } from '@playwright/test';

const API = '/api/Test/TestField';
const ROW = '.ant-table-tbody tr.ant-table-row';
/** 唯一关键字（避免并行/历史数据干扰） */
const KEYWORD = `itype-${Date.now()}`;

/** 必填字段按实体约束补齐（Avatar/FileUrl/UserId 必填） */
const RECORD = {
  ShortText: KEYWORD,
  LongText: '长文本示例',
  Int32Val: 123,
  Int64Val: 1234567890,
  DecimalVal: 12.34,
  DoubleVal: 1.5,
  FloatVal: 2.5,
  Enable: true,
  Kind: 1,
  GuidVal: '11111111-2222-3333-4444-555555555555',
  FileUrl: 'https://newlifex.com/a.pdf',
  Avatar: 'https://newlifex.com/a.png',
  JsonVal: '{"a":1}',
  HtmlVal: '<b>粗体</b>',
  MarkdownVal: '**粗体**',
  ColorVal: '#ff0000',
  IconVal: 'smile',
  MailVal: 'a@b.com',
  MobileVal: '13800138000',
  UrlVal: 'https://newlifex.com',
  SingleVal: 2,
  MultiVal: '1,2',
  UserId: '1',
  ListVal: 1,
  ListMVal: '1,2',
};

let recordId = 0;

test.beforeAll(async ({ request }) => {
  const res = await request.post(API, { data: RECORD });
  const body = await res.json();
  recordId = Number(body?.data?.id ?? 0);
  expect(recordId, '测试数据创建失败').toBeGreaterThan(0);
});

test.afterAll(async ({ request }) => {
  if (recordId > 0) await request.delete(`${API}?id=${recordId}`);
});

test.describe('ItemType 呈现（ITYPE）', () => {
  test('列表按 ItemType 呈现：image 缩略图 / color 色块 / 布尔标签', async ({ page }) => {
    const errors: string[] = [];
    page.on('console', (msg) => {
      // 截图/头像等外部静态资源不可达属环境噪音，只关注脚本错误
      if (msg.type() === 'error' && !msg.text().includes('Failed to load resource')) errors.push(msg.text());
    });

    await page.goto('/Test/TestField');
    await page.waitForSelector(ROW, { timeout: 15000 });

    const row = page.locator(`tr[data-row-key="${recordId}"]`);
    await expect(row).toBeVisible({ timeout: 10000 });

    // image → 缩略图
    await expect(row.locator('img[src*="a.png"]')).toHaveCount(1);
    // color → 色块（内联 background 被浏览器归一为 rgb）
    await expect(row.locator('span[style*="background"]').first()).toBeVisible();
    // boolean → 标签文本
    await expect(row.getByText('是', { exact: true }).first()).toBeVisible();

    expect(errors, `控制台错误: ${errors.join(' | ')}`).toEqual([]);
  });

  test('新增弹窗按 ItemType 分派控件（上传/取色/编辑器/值集）', async ({ page }) => {
    await page.goto('/Test/TestField');
    await page.getByRole('button', { name: /新增/ }).click();

    const modal = page.locator('.ant-modal:not([style*="display: none"])');
    await expect(modal).toBeVisible({ timeout: 10000 });

    // file → 上传文件按钮（富文本工具栏无同名按钮，可定位文本）
    expect(await modal.locator('button:has-text("上传文件")').count()).toBeGreaterThanOrEqual(1);
    // image → 至少一个只收图片的文件输入（富文本工具栏也有上传按钮，故不断言文本）
    expect(await modal.locator('input[type="file"][accept*="image"]').count()).toBeGreaterThanOrEqual(1);

    // color → 取色器
    await expect(modal.locator('.ant-color-picker-trigger')).toHaveCount(1);

    // json / markdown / 大文本 → 文本域（至少 3 个）
    expect(await modal.locator('textarea').count()).toBeGreaterThanOrEqual(3);

    // html → 富文本编辑器（wangEditor）
    await expect(modal.locator('.w-e-text-container')).toHaveCount(1);

    // 值集：Kind / SingleVal / MultiVal / UserId / IconVal → 下拉（至少 5 个）
    expect(await modal.locator('.ant-select').count()).toBeGreaterThanOrEqual(5);

    // 本实体无 area 字段 → 不出现省市区级联（防误判）
    await expect(modal.locator('.ant-cascader')).toHaveCount(0);
  });
});
