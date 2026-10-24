/**
 * 退出登录 E2E（CMP-5）
 *
 * ⚠️ 独立文件运行：魔方单会话策略下，admin 再次登录会禁用共享 storageState 中的旧 token，
 * 若与本套件其它 spec 并行/串行运行会污染共享会话。此用例应单独执行或作为最后一个文件执行。
 *
 * 覆盖：登录 → 用户菜单 → 退出登录 → 跳回登录页。
 */
import { expect, test } from '@playwright/test';
import { ALT_PASS, ALT_USER } from './utils/env';

test('退出登录跳转登录页', async ({ browser }) => {
  // 独立 context 重新登录：登出会撤销服务端 token；用副账号避免吊销共享 storageState
  const ctx = await browser.newContext();
  const page = await ctx.newPage();
  await page.goto('/login');
  await page.getByPlaceholder('用户名 / 邮箱 / 手机号').fill(ALT_USER);
  await page.getByPlaceholder('请输入密码').fill(ALT_PASS);
  await page.getByRole('button', { name: '登 录' }).click();
  await page.waitForURL('**/', { timeout: 10000 });
  await page.locator('.cube-user-trigger').first().click();
  await page.getByText('退出登录').click();
  await page.waitForURL(/\/login/, { timeout: 10000 });
  await ctx.close();
});
