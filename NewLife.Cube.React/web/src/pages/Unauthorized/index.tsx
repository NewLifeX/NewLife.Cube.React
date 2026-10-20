/**
 * 未授权页（403）
 */
import { Button, Result } from 'antd';
import { t } from '@/i18n';
import { useNavigate } from 'react-router-dom';

export default function UnauthorizedPage() {
  const navigate = useNavigate();
  return (
    <Result
      status="403"
      title="403"
      subTitle={t('抱歉，您没有权限访问该页面')}
      extra={
        <Button type="primary" onClick={() => navigate('/')}>
          {t('返回首页')}
        </Button>
      }
    />
  );
}
