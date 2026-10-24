/**
 * 语言切换器
 *
 * 语言清单来自后端（ReactController.Languages，等价于 MVC 魔方绑定 `CubeLocalization.GetLanguageOptions()`），
 * 接口不可用时回退内置清单；选择结果只写本地存储与 URL 参数，不写服务端 Cookie（FND-15）。
 */
import { useEffect, useMemo } from 'react';
import { Button, Dropdown } from 'antd';
import { GlobalOutlined } from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import {
  getCurrentLanguage,
  hasExplicitLanguage,
  isLanguageLocked,
  setAutoLanguage,
  setLanguage,
  type CubeLocale,
} from '@/i18n';
import { resolveSelectableLanguages } from '@/i18n/serverLanguages';
import { useServerLanguageStore } from '@/stores/serverLanguage';
import { useSiteStore } from '@/stores/site';

/** 「跟随系统」菜单项键 */
const AUTO_KEY = '__auto__';

export default function LanguageSwitch() {
  const { t } = useTranslation();
  const server = useServerLanguageStore((state) => state.info);
  // 站点锁定语言（CubeSetting.LanguageLocked）：隐藏切换入口，避免用户改了又被服务端覆盖
  const siteLocked = useSiteStore((state) => !!state.config?.language?.locked);
  const locked = !!server?.forced || siteLocked || isLanguageLocked();

  useEffect(() => {
    void useServerLanguageStore.getState().load();
  }, []);

  const options = useMemo(() => {
    // 可选语言 = 后端支持语言 ∩ 前端全量翻译语言（后端顺序与显示名优先）
    const list = resolveSelectableLanguages(server?.languages);

    return [{ value: AUTO_KEY, label: server?.autoLabel || t('跟随系统') }, ...list];
  }, [server, t]);

  const current = getCurrentLanguage();
  const selected = server?.forced || (hasExplicitLanguage() ? current : AUTO_KEY);

  const items = options.map((item) => ({
    key: item.value,
    label: item.label,
    onClick: () => {
      if (item.value === AUTO_KEY) {
        if (!hasExplicitLanguage()) return;
        setAutoLanguage();
        window.location.reload();
        return;
      }
      if (item.value === current) return;

      setLanguage(item.value as CubeLocale);
      // 菜单、实体元数据与运行时消息均由服务端按请求语言返回，刷新页面以重新拉取，
      // 避免只切换静态文案而服务端数据仍停留在旧语言
      window.location.reload();
    },
  }));

  return (
    <Dropdown
      menu={{
        items,
        selectable: true,
        selectedKeys: [selected],
        style: { maxHeight: 360, overflowY: 'auto' },
      }}
      placement="bottomRight"
      trigger={['click']}
    >
      <Button
        type="text"
        className="cube-header-action"
        icon={<GlobalOutlined />}
        disabled={locked}
        aria-label={t('common.language')}
      />
    </Dropdown>
  );
}
