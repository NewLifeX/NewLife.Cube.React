/**
 * 图标选择器（菜单图标字段专用）
 *
 * 图标值统一使用 **Element Plus 图标名**（如 Monitor / User / Tools）——这是数据库当前跨皮肤标准
 * （Vue/ElementUI 皮肤直接按名渲染），React 皮肤经 utils/icon.resolveIcon 映射为 antd 图标。
 * 避免各自皮肤存各自命名导致菜单在其它皮肤下图标失效。
 */
import { Select } from 'antd';
import { t } from '@/i18n';
import {
  AppstoreOutlined,
  BarChartOutlined,
  BellOutlined,
  CloudOutlined,
  CloudServerOutlined,
  ControlOutlined,
  DashboardOutlined,
  DatabaseOutlined,
  DesktopOutlined,
  DownloadOutlined,
  EditOutlined,
  EyeOutlined,
  FieldTimeOutlined,
  FileTextOutlined,
  FolderOutlined,
  HomeOutlined,
  IdcardOutlined,
  KeyOutlined,
  LineChartOutlined,
  LockOutlined,
  MenuOutlined,
  PhoneOutlined,
  PictureOutlined,
  PlusCircleOutlined,
  ProfileOutlined,
  ReloadOutlined,
  SafetyOutlined,
  SaveOutlined,
  SearchOutlined,
  SettingOutlined,
  ShareAltOutlined,
  ShoppingCartOutlined,
  StarOutlined,
  TableOutlined,
  TeamOutlined,
  ToolOutlined,
  TrophyOutlined,
  UnlockOutlined,
  UploadOutlined,
  UserOutlined,
} from '@ant-design/icons';

/** 选项：value 为 Element Plus 图标名（跨皮肤标准），node 为 antd 渲染 */
const ICONS: { value: string; label: string; node: React.ReactNode }[] = [
  { value: 'Monitor', label: t('显示器（系统）'), node: <DesktopOutlined /> },
  { value: 'User', label: t('用户'), node: <UserOutlined /> },
  { value: 'UserFilled', label: t('用户填充'), node: <UserOutlined /> },
  { value: 'Avatar', label: t('头像/身份'), node: <IdcardOutlined /> },
  { value: 'Team', label: t('团队'), node: <TeamOutlined /> },
  { value: 'Setting', label: t('设置'), node: <SettingOutlined /> },
  { value: 'Tools', label: t('工具'), node: <ToolOutlined /> },
  { value: 'Dashboard', label: t('仪表盘'), node: <DashboardOutlined /> },
  { value: 'DataBoard', label: t('数据面板'), node: <DashboardOutlined /> },
  { value: 'Odometer', label: t('仪表盘/计量'), node: <DashboardOutlined /> },
  { value: 'DataLine', label: t('数据曲线'), node: <LineChartOutlined /> },
  { value: 'DataAnalysis', label: t('数据分析'), node: <BarChartOutlined /> },
  { value: 'Table', label: t('表格'), node: <TableOutlined /> },
  { value: 'Document', label: t('文档'), node: <FileTextOutlined /> },
  { value: 'Folder', label: t('文件夹'), node: <FolderOutlined /> },
  { value: 'Home', label: t('首页'), node: <HomeOutlined /> },
  { value: 'Grid', label: t('应用网格'), node: <AppstoreOutlined /> },
  { value: 'CirclePlus', label: t('新增/添加'), node: <PlusCircleOutlined /> },
  { value: 'Operation', label: t('操作/管理'), node: <ControlOutlined /> },
  { value: 'Menu', label: t('菜单'), node: <MenuOutlined /> },
  { value: 'Safety', label: t('安全'), node: <SafetyOutlined /> },
  { value: 'Bell', label: t('通知'), node: <BellOutlined /> },
  { value: 'Database', label: t('数据库'), node: <DatabaseOutlined /> },
  { value: 'Server', label: t('服务器'), node: <CloudServerOutlined /> },
  { value: 'Cloud', label: t('云'), node: <CloudOutlined /> },
  { value: 'Key', label: t('密钥'), node: <KeyOutlined /> },
  { value: 'Lock', label: t('锁定'), node: <LockOutlined /> },
  { value: 'Unlock', label: t('解锁'), node: <UnlockOutlined /> },
  { value: 'Timer', label: t('计时/日志'), node: <FieldTimeOutlined /> },
  { value: 'Clock', label: t('时钟'), node: <FieldTimeOutlined /> },
  { value: 'Calendar', label: t('日历'), node: <FieldTimeOutlined /> },
  { value: 'Star', label: t('星标'), node: <StarOutlined /> },
  { value: 'Trophy', label: t('奖杯'), node: <TrophyOutlined /> },
  { value: 'ShoppingCart', label: t('购物车'), node: <ShoppingCartOutlined /> },
  { value: 'Phone', label: t('电话'), node: <PhoneOutlined /> },
  { value: 'Picture', label: t('图片'), node: <PictureOutlined /> },
  { value: 'Search', label: t('搜索'), node: <SearchOutlined /> },
  { value: 'Download', label: t('下载'), node: <DownloadOutlined /> },
  { value: 'Upload', label: t('上传'), node: <UploadOutlined /> },
  { value: 'Refresh', label: t('刷新'), node: <ReloadOutlined /> },
  { value: 'Edit', label: t('编辑'), node: <EditOutlined /> },
  { value: 'View', label: t('查看'), node: <EyeOutlined /> },
  { value: 'Share', label: t('分享'), node: <ShareAltOutlined /> },
  { value: 'Tickets', label: t('工单'), node: <ProfileOutlined /> },
  { value: 'Save', label: t('保存'), node: <SaveOutlined /> },
];

export interface IconSelectorProps {
  value?: string;
  onChange?: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
}

export default function IconSelector({ value, onChange, placeholder, disabled }: IconSelectorProps) {
  return (
    <Select
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      disabled={disabled}
      allowClear
      showSearch
      optionFilterProp="label"
      options={ICONS.map((i) => ({
        value: i.value,
        label: (
          <span>
            {i.node} {i.label}
          </span>
        ),
      }))}
      style={{ width: '100%' }}
    />
  );
}
