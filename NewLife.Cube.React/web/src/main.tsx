/**
 * 应用入口
 *
 * 创建 React 根节点并挂载 App。全局样式在此引入。
 */
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { extractTokenFromHash } from '@newlifex/cube';
import { api } from '@/api';
import './styles/global.css';

/**
 * SSO 第三方登录回调处理
 *
 * 后端 SsoController 登录成功后重定向到 `/#token=xxx`（source=front-end 场景）。
 * 这里在应用挂载前提取 hash 中的 token 写入本地存储（localStorage + Cookie），
 * 并清理 URL 中的 #token，避免路由把它当普通 hash 而丢失登录态（跳回登录页）。
 */
function handleSsoCallback() {
  const token = extractTokenFromHash();
  if (!token) return;

  // 写入本地存储（触发 CUBE_TOKEN_EVENT，登录态随之就绪）
  api.tokenManager.setToken(token);

  // 清理 hash（不刷新页面），路由按当前 path 正常匹配并放行已登录用户
  window.history.replaceState(null, '', window.location.pathname + window.location.search);
}

handleSsoCallback();

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
