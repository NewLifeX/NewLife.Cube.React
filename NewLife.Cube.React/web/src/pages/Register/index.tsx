/**
 * 注册页（独立 /register 路由）
 *
 * 复用登录页的 RegisterPanel（完整注册逻辑：密码/手机/邮箱三方式 + OAuth 预填 + 验证码），
 * 以独立页面形式承载，onBack 返回登录页。
 */
import { Alert, Spin } from 'antd';
import { AppstoreOutlined, SafetyOutlined, ThunderboltOutlined } from '@ant-design/icons';
import { useNavigate, useSearchParams } from 'react-router-dom';
import AuthLayout from '@/components/auth/AuthLayout';
import { t } from '@/i18n';
import RegisterPanel from '@/pages/Login/RegisterPanel';
import { useLoginConfig } from '@/hooks/useLoginConfig';
import { useSiteConfig } from '@/hooks/useSiteConfig';

export default function RegisterPage() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const tenant = params.get('tenant') || undefined;
  const { config, loading, error } = useLoginConfig(tenant);
  const { config: siteConfig } = useSiteConfig(tenant);

  if (loading || !config) {
    return (
      <div className="cube-fullscreen-center">
        <Spin size="large" />
      </div>
    );
  }

  return (
    <AuthLayout
      brandTitle={siteConfig?.name || t('魔方系统')}
      brandSubtitle={siteConfig?.loginTip}
      logo={
        siteConfig?.logo ? (
          <img src={siteConfig.logo} alt={siteConfig.name || ''} className="cube-auth-brand-logo" />
        ) : undefined
      }
      background={siteConfig?.loginBackground ? `url(${siteConfig.loginBackground})` : undefined}
      title={t('注册账号')}
      description={t('创建账号，开启管理后台之旅')}
      highlights={[
        { icon: <SafetyOutlined />, title: t('安全策略内置'), description: t('密码强度、验证码、激活机制开箱即用') },
        { icon: <AppstoreOutlined />, title: t('多种注册方式'), description: t('账号密码 / 手机 / 邮箱按能力开关展示') },
        { icon: <ThunderboltOutlined />, title: t('登录即达'), description: t('注册成功自动进入系统，无需重复登录') },
      ]}
      footer={siteConfig?.copyright ? <span dangerouslySetInnerHTML={{ __html: siteConfig.copyright }} /> : undefined}
    >
      {error && <Alert type="error" message={error} />}
      <RegisterPanel config={config} onBack={() => navigate('/login')} />
    </AuthLayout>
  );
}
