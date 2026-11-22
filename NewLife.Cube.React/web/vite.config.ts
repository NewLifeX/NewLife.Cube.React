import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { fileURLToPath, URL } from 'node:url';

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  return {
    plugins: [react()],
    resolve: {
      alias: {
        '@': fileURLToPath(new URL('./src', import.meta.url)),
      },
    },
    build: {
      // 构建产物输出到上级 wwwroot，供 .NET 嵌入式资源打包
      // 仅开发模式生成 sourcemap；生产构建嵌入 DLL 时关闭，避免 13MB+ 的 .map 撑大程序集
      sourcemap: mode === 'development',
      outDir: '../wwwroot',
      emptyOutDir: true,
      // 管理台单页应用的主包约 1.1 MB（gzip 约 340 KB），依赖已按域拆分；
      // 产物整体嵌入 DLL 由本机静态服务提供，不再追求更细的首屏切片
      chunkSizeWarningLimit: 1200,
      // 按依赖域拆包，避免单个 JS 文件超过 500 KB 触发构建警告
      rolldownOptions: {
        output: {
          codeSplitting: {
            // 单个分包上限 400 KB，超出后由打包器继续拆分
            maxSize: 400000,
            groups: [
              { name: 'react', test: /node_modules[\\/](react|react-dom|react-router|react-router-dom|scheduler)[\\/]/, priority: 10 },
              { name: 'antd', test: /node_modules[\\/](antd|@ant-design|@rc-component|rc-[a-z-]+)[\\/]/, priority: 10 },
              { name: 'echarts', test: /node_modules[\\/](echarts|zrender)[\\/]/, priority: 10 },
              { name: 'editor', test: /node_modules[\\/](@wangeditor|slate|dompurify|marked)[\\/]/, priority: 10 },
              { name: 'i18n', test: /node_modules[\\/](i18next|react-i18next|dayjs|lodash)[\\/]/, priority: 10 },
              { name: 'cube', test: /node_modules[\\/]@newlifex[\\/]/, priority: 10 },
              { name: 'vendor', test: /node_modules[\\/]/, priority: 0 },
            ],
          },
        },
      },
    },
    server: {
      port: 5188,
      // 前端 API 请求经 Vite 代理转发到本地 CubeDemo 后端（:5050）。
      // .env.development 中 VITE_API_URL=/api，所有请求带 /api 前缀，
      // 这里剥离 /api 后转发到 :5050（:5050 自身无 /api 前缀路由）。
      proxy: {
        '/api': {
          target: 'http://localhost:5050',
          changeOrigin: true,
          rewrite: (p) => p.replace(/^\/api/, ''),
        },
        // AI 服务接口（/Ai/AiChat）不带 /api 前缀
        '/Ai': {
          target: 'http://localhost:5050',
          changeOrigin: true,
        },
        // SSO 绑定/解绑（/Sso/Bind、/Sso/UnBind）不带 /api 前缀
        '/Sso': {
          target: 'http://localhost:5050',
          changeOrigin: true,
        },
      },
    },
  };
});
