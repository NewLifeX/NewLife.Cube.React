/**
 * 语言切换器
 */
import { Button, Dropdown } from 'antd';
import { GlobalOutlined } from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import { getCurrentLanguage, setLanguage, supportedLanguages, type CubeLocale } from '@/i18n';

export default function LanguageSwitch() {
  const { t } = useTranslation();

  const items = supportedLanguages.map((l) => ({
    key: l.value,
    label: l.label,
    onClick: () => {
      if (l.value === getCurrentLanguage()) return;
      setLanguage(l.value as CubeLocale);
      // 菜单、实体元数据与运行时消息均由服务端按请求语言返回，刷新页面以重新拉取，
      // 避免只切换静态文案而服务端数据仍停留在旧语言
      window.location.reload();
    },
  }));

  return (
    <Dropdown
      menu={{ items, selectable: true, selectedKeys: [getCurrentLanguage()] }}
      placement="bottomRight"
      trigger={['click']}
    >
      <Button
        type="text"
        className="cube-header-action"
        icon={<GlobalOutlined />}
        aria-label={t('common.language')}
      />
    </Dropdown>
  );
}
