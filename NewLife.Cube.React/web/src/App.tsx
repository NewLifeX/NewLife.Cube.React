/**
 * 根组件
 *
 * - ConfigProvider：antd 主题（单一主题 × 明暗）+ 与 i18n 同步的组件语言包
 * - AntApp：message/notification/modal 上下文（供 App.useApp() 使用）
 * - AntdAppBinder：把 useApp 实例托管给非组件模块（api 拦截器等）
 * - RouterProvider：路由系统
 */
import { useEffect } from 'react';
import { App as AntApp, ConfigProvider, theme as antdTheme } from 'antd';
import { RouterProvider } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { router } from '@/router';
import { useThemeStore } from '@/stores/theme';
import { applyTableCellCssVars, buildThemeConfig } from '@/themes';
import { bindAntdApp } from '@/utils/antdApp';
import { getAntdLocale, getCurrentLanguage, isRtl, setLanguage, supportedLanguages, type CubeLocale } from '@/i18n';
import { useServerLanguageStore } from '@/stores/serverLanguage';

/** 在 <App> 上下文内绑定 useApp 实例，供非组件模块（api 拦截器等）复用 */
function AntdAppBinder() {
  const app = AntApp.useApp();
  useEffect(() => {
    bindAntdApp(app);
  }, [app]);
  return null;
}

export default function App() {
  const mode = useThemeStore((s) => s.mode);
  // 订阅语言变化，使 antd 组件语言包随 i18n 同步切换
  useTranslation();

  const serverLanguage = useServerLanguageStore((s) => s.info);

  // 启动时拉取后端语言清单（含强制语言），登录页也生效
  useEffect(() => {
    void useServerLanguageStore.getState().load();
  }, []);

  // NewLife.Setting.Language 强制语言：前端跟随一次后刷新，保证界面与服务端元数据同语言
  useEffect(() => {
    const forced = serverLanguage?.forced;
    const flagKey = 'cube-language-forced';

    if (!forced) {
      try {
        sessionStorage.removeItem(flagKey);
      } catch {
        // 忽略存储不可用
      }
      return;
    }

    if (forced === getCurrentLanguage()) return;
    if (!supportedLanguages.some((item) => item.value === forced)) return;

    // 存储被浏览器禁用时避免反复刷新：同一强制语言只尝试跟随一次
    try {
      if (sessionStorage.getItem(flagKey) === forced) return;
      sessionStorage.setItem(flagKey, forced);
    } catch {
      // 存储不可用时仍尝试跟随
    }

    setLanguage(forced as CubeLocale);
    window.location.reload();
  }, [serverLanguage]);

  // 同步 body 明暗属性，供全局 CSS 深浅色设计令牌切换；并注入表格冻结列不透明背景变量
  useEffect(() => {
    document.body.dataset.cubeMode = mode;
    applyTableCellCssVars(mode);
  }, [mode]);

  const themeConfig = buildThemeConfig(mode);

  return (
    <ConfigProvider
      locale={getAntdLocale()}
      direction={isRtl(getCurrentLanguage()) ? 'rtl' : 'ltr'}
      theme={{
        ...themeConfig,
        algorithm: mode === 'dark' ? antdTheme.darkAlgorithm : antdTheme.defaultAlgorithm,
      }}
    >
      <AntApp>
        <AntdAppBinder />
        <div className="cube-app">
          <RouterProvider router={router} />
        </div>
      </AntApp>
    </ConfigProvider>
  );
}
