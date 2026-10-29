/**
 * 账号级共享状态串行锁（跨 worker 文件锁）
 *
 * 以下状态按**登录账号**存储在服务端，Playwright 并行 worker 会互相覆盖：
 * - `ReactSetting`（配置导航排布 / 表单风格 / 地区选择方案）——config、react-setting、user-area
 * - 工作台布局 `Parameter`（卡片隐藏 / 排序）——home、widget
 *
 * 这些 spec 从本模块导入 `test` 即自动加锁，用例体无需改动。
 * 锁目录放在 `test-results/`（每次运行前被 Playwright 清空），worker 异常退出留下的
 * 死锁超过 5 分钟自动视为陈旧并清理。
 */
import { mkdir, rm, stat } from 'node:fs/promises';
import { test as base, expect } from '@playwright/test';

/** 锁目录：用 mkdir 的原子性实现跨进程互斥 */
const LOCK_ROOT = 'test-results';
const LOCK_DIR = `${LOCK_ROOT}/.account-state.lock`;
/** 死锁判定（worker 异常退出时残留） */
const STALE_MS = 5 * 60 * 1000;
/** 等锁上限：五个 spec 全量串行也在 3 分钟内，留足余量 */
const TIMEOUT_MS = 5 * 60 * 1000;

/** 获取锁（自旋等待） */
async function acquire(): Promise<void> {
  const start = Date.now();
  for (;;) {
    try {
      await mkdir(LOCK_ROOT, { recursive: true });
      await mkdir(LOCK_DIR);
      return;
    } catch (e) {
      if ((e as NodeJS.ErrnoException).code !== 'EEXIST') throw e;
      try {
        const info = await stat(LOCK_DIR);
        if (Date.now() - info.mtimeMs > STALE_MS) await rm(LOCK_DIR, { recursive: true, force: true });
      } catch {
        // 另一 worker 刚释放，直接重试
      }
      if (Date.now() - start > TIMEOUT_MS) throw new Error(`等待账号状态锁超时：${LOCK_DIR}`);
      await new Promise((resolve) => setTimeout(resolve, 200));
    }
  }
}

/** 释放锁 */
async function release(): Promise<void> {
  await rm(LOCK_DIR, { recursive: true, force: true });
}

/**
 * 自动加锁的 test
 *
 * 用法：会读写账号级共享状态的 spec 从本模块导入，而非 `@playwright/test`。
 */
export const test = base.extend<{ accountStateLock: void }>({
  accountStateLock: [
    // eslint-disable-next-line no-empty-pattern
    async ({}, use) => {
      await acquire();
      try {
        await use();
      } finally {
        await release();
      }
    },
    { auto: true },
  ],
});

export { expect };
