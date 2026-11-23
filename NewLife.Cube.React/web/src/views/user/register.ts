/**
 * 用户页内置扩展
 *
 * - 旧版 Cube 包仍下发 MVC 时代的 Link/Token/Log/OAuthLog 导航列，React 列表里没有数据值，
 *   通过 preset 默认移除；新版后端已在 API 元数据中移除。
 * - 点击头像/名称进入用户详情路由页。
 */
import { registerPagePreset } from '@newlifex/cube';
import { registerPageExtension } from '@/rendering/pageExtensions';
import { t } from '@/i18n';
import { getValueByKey, resolveUrl } from '@/utils/url';

registerPagePreset('/Admin/User', {
  list: { remove: ['Link', 'Token', 'Log', 'OAuthLog'] },
});

registerPageExtension('Admin/User', {
  rowLink: {
    fields: ['AvatarImage', 'Name', 'DisplayName'],
    title: t('查看用户详情'),
    to: (row) => {
      const id = getValueByKey(row, 'Id');
      if (!id) return null;

      const url = resolveUrl('/Admin/User/Detail/{Id}', row);
      // 带上列表当前地址（含搜索条件），详情页“返回用户列表”可原样回去
      const from = `${window.location.pathname}${window.location.search}`;
      return `${url}?from=${encodeURIComponent(from)}`;
    },
  },
});
