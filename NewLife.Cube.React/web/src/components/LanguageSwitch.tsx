/**
 * 语言切换器
 *
 * 语言清单来自后端（ReactController.Languages，等价于 MVC 魔方绑定 `CubeLocalization.GetLanguageOptions()`），
 * 接口不可用时回退内置清单；选择结果写入 `.AspNet.Culture` Cookie 与本地存储，并刷新页面重取服务端数据。
 */
import { useEffect, useMemo } from 'react';
import { Button, Dropdown } from 'antd';
import { GlobalOutlined } from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import {
  getCurrentLanguage,
  hasExplicitLanguage,
  setAutoLanguage,
  setLanguage,
  type CubeLocale,
} from '@/i18n';
import { resolveSelectableLanguages } from '@/i18n/serverLanguages';
import { useServerLanguageStore } from '@/stores/serverLanguage';

/** 「跟随系统」菜单项键 */
const AUTO_KEY = '__auto__';

export default function LanguageSwitch() {
  const { t } = useTranslation();
  const server = useServerLanguageStore((state) => state.info);

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
        disabled={!!server?.forced}
        aria-label={t('common.language')}
      />
    </Dropdown>
  );
}
