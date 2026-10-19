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
    onClick: () => setLanguage(l.value as CubeLocale),
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
