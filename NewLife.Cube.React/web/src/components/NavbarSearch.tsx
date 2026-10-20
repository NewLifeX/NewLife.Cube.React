/**
 * 导航搜索（菜单快速搜索，对齐 Vue 皮肤 components/NavbarSearch.vue）
 */
import { useMemo, useState } from 'react';
import { AutoComplete } from 'antd';
import { SearchOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { useMenuStore } from '@/stores/menu';
import { t } from '@/i18n';
import { useReactSetting } from '@/stores/reactSetting';
import FocusClearInput from '@/components/field/FocusClearInput';

export default function NavbarSearch() {
  const navigate = useNavigate();
  const flatMenus = useMenuStore((s) => s.flatMenus);
  const [value, setValue] = useState('');
  const { inputClear } = useReactSetting();

  const options = useMemo(() => {
    if (!value) return [];
    const kw = value.toLowerCase();
    // 仅搜索可见菜单（隐藏菜单如 UserOnline/UserStat 不出现在搜索结果）
    return flatMenus
      .filter((m) => m.visible !== false && m.path && (m.title || m.name).toLowerCase().includes(kw))
      .slice(0, 10)
      .map((m) => ({ value: m.path, label: `${m.title || m.name}（${m.path}）` }));
  }, [flatMenus, value]);

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
