/**
 * 明暗模式切换器
 */
import { Button, Tooltip } from 'antd';
import { MoonOutlined, SunOutlined } from '@ant-design/icons';
import { useThemeStore } from '@/stores/theme';
import { t } from '@/i18n';

export default function ModeSwitcher() {
  const mode = useThemeStore((s) => s.mode);
  const toggleMode = useThemeStore((s) => s.toggleMode);

  return (
    <Tooltip title={mode === 'dark' ? t('切换到浅色模式') : t('切换到深色模式')}>
      <Button
        type="text"
        className="cube-header-action"
        icon={mode === 'dark' ? <SunOutlined /> : <MoonOutlined />}
        onClick={toggleMode}
      />
    </Tooltip>
  );
}
