/**
 * 账号激活页（对齐 Vue 皮肤 pages/ActivatePage.vue）
 *
 * 两种激活方式：
 * 1. 邮箱链接直达：/activate?token=xxx&account=xxx → GET /Auth/Activate
 * 2. 验证码激活：邮箱/手机号 + 验证码（发码 POST /Auth/SendCode action=activate）→ POST /Auth/Activate
 */
import { useEffect, useState } from 'react';
import { Alert, App, Button, Form, Input, Radio } from 'antd';
import { MailOutlined, MobileOutlined, SafetyOutlined } from '@ant-design/icons';
import { useNavigate, useSearchParams } from 'react-router-dom';
import AuthLayout from '@/components/auth/AuthLayout';
import { api } from '@/api';
import { t } from '@/i18n';

export default function ActivatePage() {
  const { message } = App.useApp();
  const [form] = Form.useForm();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const [done, setDone] = useState(false);
  const [linkError, setLinkError] = useState('');
  const [sending, setSending] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [channel, setChannel] = useState<'mail' | 'sms'>('mail');

  // 链接直达激活
  useEffect(() => {
    const token = params.get('token');
    const account = params.get('account');
    if (token && account) {
      api.user
        .activateByLink(token, account)
        .then(() => setDone(true))
        .catch((err: Error) => setLinkError(err.message || t('激活链接无效或已过期')));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSendCode = async () => {
    const values = await form.validateFields(['account']);
    setSending(true);
    try {
      await api.user.sendCode({
        channel: channel === 'mail' ? 'Mail' : 'Sms',
        username: values.account,
        action: 'activate',
      });
      message.success(t('验证码已发送'));
    } catch (err) {
      message.error((err as Error)?.message || t('发送失败'));
    } finally {
      setSending(false);
    }
  };

  const handleSubmit = async () => {
    const values = await form.validateFields();
    setSubmitting(true);
    try {
      const res = await api.user.activateByCode({
        channel: channel === 'mail' ? 'Mail' : 'Sms',
        account: values.account,
        code: values.code,
      });
      if (res.data?.activated) {
        message.success(t('激活成功'));
        setDone(true);
      } else {
        message.warning(t('激活未完成，请检查验证码'));
      }
    } catch (err) {
      message.error((err as Error)?.message || t('激活失败'));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AuthLayout
      brandTitle={t('魔方系统')}
      brandSubtitle={t('激活邮箱 / 手机后即可正常登录')}
      title={t('账号激活')}
      description={t('通过邮箱或手机验证码激活账号')}
      highlights={[
        { icon: <MailOutlined />, title: t('邮箱激活'), description: t('点击邮件链接或输入验证码') },
        { icon: <MobileOutlined />, title: t('手机激活'), description: t('接收短信验证码完成激活') },
        { icon: <SafetyOutlined />, title: t('安全校验'), description: t('激活后才可登录系统') },
      ]}
      footer="©2002-2026 NewLife"
    >
      {done ? (
        <div style={{ display: 'grid', gap: 16, textAlign: 'center' }}>
          <Alert type="success" showIcon message={t('激活成功')} description={t('您的账号已激活，现在可以登录了')} />
          <Button type="primary" block onClick={() => navigate('/login')}>
            {t('前往登录')}
          </Button>
        </div>
      ) : (
        <Form form={form} layout="vertical" requiredMark={false}>
          {linkError && (
            <Alert type="warning" showIcon message={linkError} description={t('您也可以在下方输入验证码完成激活')} style={{ marginBottom: 16 }} />
          )}

          <Form.Item label={t('激活渠道')}>
            <Radio.Group value={channel} onChange={(e) => setChannel(e.target.value)}>
              <Radio.Button value="mail">{t('邮箱激活')}</Radio.Button>
              <Radio.Button value="sms">{t('手机激活')}</Radio.Button>
            </Radio.Group>
          </Form.Item>

          <Form.Item
            name="account"
            label={channel === 'mail' ? t('邮箱') : t('手机号')}
            rules={[
              { required: true, message: t('请输入{{name}}', { name: channel === 'mail' ? t('邮箱') : t('手机号') }) },
              channel === 'mail'
                ? { type: 'email', message: t('邮箱格式不正确') }
                : { pattern: /^1\d{10}$/, message: t('手机号格式不正确') },
            ]}
          >
            <Input placeholder={channel === 'mail' ? t('请输入邮箱') : t('请输入手机号')} size="large" />
          </Form.Item>

          <Form.Item name="code" label={t('验证码')} rules={[{ required: true, message: t('请输入验证码') }]}>
            <div className="cube-auth-captcha">
              <Input placeholder={t('验证码')} size="large" maxLength={6} />
              <Button size="large" loading={sending} onClick={() => void handleSendCode()}>
                {t('发送验证码')}
              </Button>
            </div>
          </Form.Item>

          <Button type="primary" block size="large" loading={submitting} onClick={() => void handleSubmit()}>
            {t('激活')}
          </Button>
          <div className="cube-auth-form-footer-link">
            <Button type="link" onClick={() => navigate('/login')}>
              {t('返回登录')}
            </Button>
          </div>
        </Form>
      )}
    </AuthLayout>
  );
}
