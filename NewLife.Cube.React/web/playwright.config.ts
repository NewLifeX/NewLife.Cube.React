import { defineConfig, devices } from '@playwright/test';

/**
 * Playwright E2E 配置（对齐 Vue 皮肤 web/e2e）
 *
 * 运行前需启动被测后端（CubeDemo + React 皮肤）：
 *   cd Bin/CubeDemo && ./CubeDemo.exe --urls http://*:5050
 *
 * 也可用环境变量 E2E_BASE_URL 指向其它站点（如 React 自托管一体化站点 7081）：
 *   $env:E2E_BASE_URL="http://localhost:7081"; pnpm test:e2e
 */
const baseURL = process.env.E2E_BASE_URL || 'http://localhost:5050';

export default defineConfig({
  testDir: './e2e',
  timeout: 30000,
  fullyParallel: false,
  // 限制并发 workers：7081 一体站点并发压力过大时 list.spec 等用例偶发时序失败（单独跑均通过）
  workers: 4,
  // 偶发失败重试 1 次：工作台 Dashboard 请求在服务端高负载时偶发网络失败（前端降级渲染，home/widget 卡断言语义变化），
  // 单独跑均通过，重试可显著降低全量跑抖动（配合 widget.spec 布局 afterEach 清理）
  retries: 1,
  reporter: [['list']],
  use: {
    baseURL,
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    // 支持 https 自签证书站点（如 launchSettings 默认的 https://localhost:7116）
    ignoreHTTPSErrors: true,
  },
  projects: [
    {
      name: 'setup',
      testMatch: /auth\.setup\.ts/,
    },
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'], storageState: '.auth/admin.json' },
      dependencies: ['setup'],
    },
  ],
});
