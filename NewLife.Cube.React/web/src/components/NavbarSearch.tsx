/**
 * 导航搜索（菜单快速搜索，对齐 Vue 皮肤 components/SearchBar.vue）
 *
 * 是否显示由 `CubeSetting.EnableMenuSearch` 经 /Cube/Site 的 features.menuSearch 下发；
 * 字段缺失（旧后端）时默认显示。搜索包含隐藏菜单，并支持显示名、菜单名、地址与拼音。
 */
import { useMemo, useState } from 'react';
import { AutoComplete } from 'antd';
import { SearchOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { useMenuStore } from '@/stores/menu';
import { useSiteStore } from '@/stores/site';
import { searchMenus } from '@/utils/menuSearch';
import { t } from '@/i18n';
import { useReactSetting } from '@/stores/reactSetting';
import FocusClearInput from '@/components/field/FocusClearInput';

export default function NavbarSearch() {
  const navigate = useNavigate();
  const flatMenus = useMenuStore((s) => s.flatMenus);
  const menuSearchEnabled = useSiteStore((s) => s.config?.features?.menuSearch !== false);
  const [value, setValue] = useState('');
  const { inputClear } = useReactSetting();

  const options = useMemo(() => {
    if (!value.trim()) return [];
    return searchMenus(flatMenus, value, 10).map(({ menu, path }) => ({
      value: menu.path,
      label: (
        <span className="cube-navbar-search-option">
          <span className="cube-navbar-search-title">{menu.title || menu.name}</span>
          <span className="cube-navbar-search-path">{path}</span>
        </span>
      ),
    }));
  }, [flatMenus, value]);

  if (!menuSearchEnabled) return null;

  return (
    <AutoComplete
      className="cube-navbar-search"
      options={options}
      value={value}
      onChange={setValue}
      onSelect={(path) => {
        navigate(path);
        setValue('');
      }}
    >
      <FocusClearInput prefix={<SearchOutlined />} showClear={inputClear} placeholder={t('搜索菜单')} />
    </AutoComplete>
  );
}
