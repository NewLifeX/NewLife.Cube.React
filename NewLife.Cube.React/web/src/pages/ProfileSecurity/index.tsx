/**
 * 安全中心（对齐 Vue 皮肤 pages/ProfileSecurity.vue + MFA 增强 + 修改密码）
 *
 * 1. 邮箱/手机验证状态（/Auth/Info 的 mailVerified/mobileVerified）
 * 2. 验证/更换联系方式（发码 /Auth/SendCode action=bind，提交 /Auth/VerifyContact）
 * 3. 修改密码（POST /Admin/User/ChangePassword，对齐 MVC ChangePassword 页）
 * 4. MFA 双因素认证：状态/绑定（二维码+密钥）/激活（备用码）/解绑
 * 5. 注销账号（POST /Auth/CloseAccount，不可恢复；成功后清理本地登录态并跳登录页）
 */
import { useEffect, useState } from 'react';
import { Alert, App, Button, Card, Descriptions, Form, Input, Modal, Space, Tag } from 'antd';
import { LockOutlined } from '@ant-design/icons';
import { api } from '@/api';
import { t } from '@/i18n';
import { useUserStore, logoutAndRedirect } from '@/stores/user';

type Panel = 'mail' | 'sms' | null;

export default function ProfileSecurityPage() {
  const { message } = App.useApp();
  const [form] = Form.useForm();
  const [pwdForm] = Form.useForm();
  const userInfo = useUserStore((s) => s.userInfo);
  const [panel, setPanel] = useState<Panel>(null);
  const [sending, setSending] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [pwdSubmitting, setPwdSubmitting] = useState(false);

  /** 修改密码：POST /Admin/User/ChangePassword（SSO 登录可免原密码，本地登录须原密码） */
  const handleChangePassword = async () => {
    const values = await pwdForm.validateFields();
    setPwdSubmitting(true);
    try {
      await api.user.changePassword({
        oldPassword: values.oldPassword ?? '',
        newPassword: values.newPassword,
        newPassword2: values.newPassword2,
      });
      message.success(t('密码修改成功'));
      pwdForm.resetFields();
    } catch (err) {
      // 字段级/业务错误已由全局拦截提示，这里兜底
      message.error((err as Error)?.message || t('修改失败'));
    } finally {
      setPwdSubmitting(false);
    }
  };

  // 注销账号
  const [closeOpen, setCloseOpen] = useState(false);
  const [closeSubmitting, setCloseSubmitting] = useState(false);

  /** 注销账号：禁用并脱敏账号，通知下游清理业务数据；成功后清理本地登录态并跳转登录页（登出接口失败已容错） */
  const handleCloseAccount = async () => {
    setCloseSubmitting(true);
    try {
      await api.user.closeAccount();
      message.success(t('账号已注销'));
      setCloseOpen(false);
      await logoutAndRedirect();
    } catch (err) {
      // 字段级/业务错误已由全局拦截提示，这里兜底
      message.error((err as Error)?.message || t('注销失败'));
    } finally {
      setCloseSubmitting(false);
    }
  };

  // MFA 状态
  const [mfaEnabled, setMfaEnabled] = useState(false);
  const [mfaAvailable, setMfaAvailable] = useState(false);
  const [mfaSetup, setMfaSetup] = useState<{ qrCodeUri: string; secret: string } | null>(null);
  const [backupCodes, setBackupCodes] = useState<string[] | null>(null);
  const [mfaCode, setMfaCode] = useState('');
  const [mfaBusy, setMfaBusy] = useState(false);
  const [disableOpen, setDisableOpen] = useState(false);
  const [disableCode, setDisableCode] = useState('');

  useEffect(() => {
    api.user
      .mfaStatus()
      .then((res) => {
        setMfaEnabled(!!res.data?.enabled);
        setMfaAvailable(!!res.data?.available);
      })
      .catch(() => {
        // 后端不支持 MFA 时静默
      });
  }, []);

  const handleSendVerifyCode = async () => {
    const values = await form.validateFields(['account']);
    setSending(true);
    try {
      await api.user.sendCode({
        channel: panel === 'mail' ? 'Mail' : 'Sms',
        username: values.account,
        action: 'bind',
      });
      message.success(t('验证码已发送'));
    } catch (err) {
      message.error((err as Error)?.message || t('发送失败'));
    } finally {
      setSending(false);
    }
  };

  const handleVerify = async () => {
    const values = await form.validateFields();
    setSubmitting(true);
    try {
      const res = await api.user.verifyContact({
        channel: panel === 'mail' ? 'Mail' : 'Sms',
        account: values.account,
        code: values.code,
      });
      message.success(t('验证成功'));
      setPanel(null);
      form.resetFields();
      // 刷新用户信息
      void useUserStore.getState().fetchUserInfo();
    } catch (err) {
      message.error((err as Error)?.message || t('验证失败'));
    } finally {
      setSubmitting(false);
    }
  };

  // ── MFA ─────────────────────────────────────────────
  const handleMfaSetup = async () => {
    setMfaBusy(true);
    try {
      const res = await api.user.mfaSetup();
      setMfaSetup(res.data);
    } catch (err) {
      message.error((err as Error)?.message || t('初始化失败'));
    } finally {
      setMfaBusy(false);
    }
  };

  const handleMfaActivate = async () => {
    if (!mfaCode) return;
    setMfaBusy(true);
    try {
      const res = await api.user.mfaActivate(mfaCode);
      setBackupCodes(res.data?.backupCodes ?? []);
      setMfaEnabled(true);
      setMfaSetup(null);
      message.success(t('MFA 已开启'));
    } catch (err) {
      message.error((err as Error)?.message || t('激活失败'));
    } finally {
      setMfaBusy(false);
    }
  };

  const handleMfaDisable = async () => {
    if (!disableCode) return;
    setMfaBusy(true);
    try {
      await api.user.mfaDisable(disableCode);
      setMfaEnabled(false);
      setDisableOpen(false);
      setDisableCode('');
      message.success(t('MFA 已关闭'));
    } catch (err) {
      message.error((err as Error)?.message || t('关闭失败'));
    } finally {
      setMfaBusy(false);
    }
  };

  return (
    <div style={{ maxWidth: 720, margin: '0 auto' }}>
      <Card title={t('联系方式验证')} style={{ marginBottom: 16 }}>
        <Descriptions
          column={1}
          size="medium"
          items={[
            {
              key: 'mail',
              label: t('邮箱'),
              children: (
                <Space>
                  <span>{userInfo?.mail || t('未绑定')}</span>
                  {userInfo?.mail && (
                    <Tag color={userInfo.mailVerified ? 'success' : 'warning'}>
                      {userInfo.mailVerified ? t('已验证') : t('未验证')}
                    </Tag>
                  )}
                  {userInfo?.mail && (
                    <Button size="small" onClick={() => setPanel(panel === 'mail' ? null : 'mail')}>
                      {userInfo.mailVerified ? t('更换') : t('验证')}
                    </Button>
                  )}
                </Space>
              ),
            },
            {
              key: 'mobile',
              label: t('手机号'),
              children: (
                <Space>
                  <span>{userInfo?.mobile || t('未绑定')}</span>
                  {userInfo?.mobile && (
                    <Tag color={userInfo.mobileVerified ? 'success' : 'warning'}>
                      {userInfo.mobileVerified ? t('已验证') : t('未验证')}
                    </Tag>
                  )}
                  {userInfo?.mobile && (
                    <Button size="small" onClick={() => setPanel(panel === 'sms' ? null : 'sms')}>
                      {userInfo.mobileVerified ? t('更换') : t('验证')}
                    </Button>
                  )}
                </Space>
              ),
            },
          ]}
        />

        {panel && (
          <Form form={form} layout="vertical" style={{ marginTop: 16 }}>
            <Form.Item
              name="account"
              label={panel === 'mail' ? t('新邮箱') : t('新手机号')}
              rules={[
                { required: true, message: t('请输入') },
                panel === 'mail'
                  ? { type: 'email', message: t('邮箱格式不正确') }
                  : { pattern: /^1\d{10}$/, message: t('手机号格式不正确') },
              ]}
            >
              <Input placeholder={panel === 'mail' ? t('请输入新邮箱') : t('请输入新手机号')} />
            </Form.Item>
            <Form.Item name="code" label={t('验证码')} rules={[{ required: true, message: t('请输入验证码') }]}>
              <Space.Compact style={{ width: '100%' }}>
                <Input placeholder={t('验证码')} maxLength={6} />
                <Button loading={sending} onClick={() => void handleSendVerifyCode()}>
                  {t('发送验证码')}
                </Button>
              </Space.Compact>
            </Form.Item>
            <Button type="primary" loading={submitting} onClick={() => void handleVerify()}>
              {t('验证')}
            </Button>
          </Form>
        )}
      </Card>

      {/* 修改密码（对齐 MVC ChangePassword 页） */}
      <Card title={t('修改密码')} style={{ marginBottom: 16 }}>
        <Form form={pwdForm} layout="vertical" style={{ maxWidth: 520 }} onFinish={handleChangePassword}>
          <Form.Item
            name="oldPassword"
            label={t('原密码')}
            rules={[{ required: true, message: t('请输入原密码') }]}
            extra={t('SSO 第三方登录用户可留空')}
          >
            <Input.Password prefix={<LockOutlined />} placeholder={t('请输入原密码')} autoComplete="current-password" />
          </Form.Item>
          <Form.Item
            name="newPassword"
            label={t('新密码')}
            rules={[
              { required: true, message: t('请输入新密码') },
              { min: 8, message: t('密码至少 8 位') },
            ]}
            extra={t('要求 8 位起且包含数字、大小写字母和符号')}
          >
            <Input.Password prefix={<LockOutlined />} placeholder={t('请输入新密码')} autoComplete="new-password" />
          </Form.Item>
          <Form.Item
            name="newPassword2"
            label={t('确认新密码')}
            dependencies={['newPassword']}
            rules={[
              { required: true, message: t('请再次输入新密码') },
              ({ getFieldValue }) => ({
                validator: (_, value) =>
                  !value || getFieldValue('newPassword') === value
                    ? Promise.resolve()
                    : Promise.reject(new Error(t('两次输入的密码不一致'))),
              }),
            ]}
          >
            <Input.Password prefix={<LockOutlined />} placeholder={t('请再次输入新密码')} autoComplete="new-password" />
          </Form.Item>
          <Button type="primary" htmlType="submit" loading={pwdSubmitting}>
            {t('修改密码')}
          </Button>
        </Form>
      </Card>

      <Card title={t('双重验证（MFA）')}>
        {!mfaAvailable ? (
          <Alert type="info" showIcon message={t('当前系统未开放 MFA 功能')} />
        ) : (
          <Space orientation="vertical" style={{ width: '100%' }}>
            {mfaEnabled ? (
              <Alert
                type="success"
                showIcon
                message={t('MFA 已开启')}
                description={t('登录时需要输入身份验证器动态验证码。')}
                action={<Button danger size="small" onClick={() => setDisableOpen(true)}>{t('关闭 MFA')}</Button>}
              />
            ) : (
              <Alert
                type="warning"
                showIcon
                message={t('MFA 未开启')}
                description={t('开启后登录将需要身份验证器动态验证码，提升账号安全性。')}
                action={
                  <Button type="primary" size="small" loading={mfaBusy} onClick={() => void handleMfaSetup()}>
                    {t('开启 MFA')}
                  </Button>
                }
              />
            )}

            {mfaSetup && (
              <Card size="small" title={t('绑定 MFA')}>
                <Space orientation="vertical" style={{ width: '100%' }}>
                  <img
                    src={mfaSetup.qrCodeUri}
                    alt={t('双重验证（MFA）')}
                    style={{ width: 160, height: 160, alignSelf: 'center' }}
                  />
                  <Alert
                    type="info"
                    showIcon
                    message={t('使用身份验证器 App 扫码，或手动输入密钥')}
                    description={mfaSetup.secret}
                  />
                  <Space.Compact style={{ width: '100%' }}>
                    <Input
                      placeholder={t('输入 App 中显示的 6 位验证码')}
                      maxLength={6}
                      value={mfaCode}
                      onChange={(e) => setMfaCode(e.target.value)}
                    />
                    <Button type="primary" loading={mfaBusy} onClick={() => void handleMfaActivate()}>
                      {t('激活')}
                    </Button>
                  </Space.Compact>
                </Space>
              </Card>
            )}

            {backupCodes && (
              <Alert
                type="warning"
                showIcon
                message={t('请妥善保存备用验证码')}
                description={
                  <div>
                    {t('每个备用码仅可使用一次，用于无法使用验证器时恢复登录：')}
                    <pre style={{ background: '#f5f5f5', padding: 8, borderRadius: 4 }}>{backupCodes.join('\n')}</pre>
                  </div>
                }
                action={<Button size="small" onClick={() => setBackupCodes(null)}>{t('我已保存')}</Button>}
              />
            )}
          </Space>
        )}
      </Card>

      {/* 注销账号（危险操作，不可恢复） */}
      <Card title={t('注销账号')} style={{ marginBottom: 16 }}>
        <Alert
          type="warning"
          showIcon
          message={t('注销后账号将被禁用，个人数据将删除或匿名化，且不可恢复')}
          description={t('依据《中华人民共和国个人信息保护法》与 GDPR 等法规，你享有账号删除权。注销为不可逆操作：账号将无法再次登录，下游业务系统中与该账号关联的数据将一并删除。')}
          style={{ marginBottom: 16 }}
        />
        <Button danger loading={closeSubmitting} onClick={() => setCloseOpen(true)}>
          {t('注销账号')}
        </Button>
      </Card>

      <Modal
        title={t('关闭 MFA')}
        open={disableOpen}
        onCancel={() => setDisableOpen(false)}
        onOk={() => void handleMfaDisable()}
        confirmLoading={mfaBusy}
        okText={t('关闭')}
        okButtonProps={{ danger: true }}
      >
        <p>{t('请输入当前身份验证器中的 6 位动态验证码以确认关闭：')}</p>
        <Input
          placeholder={t('6 位动态验证码')}
          maxLength={6}
          value={disableCode}
          onChange={(e) => setDisableCode(e.target.value)}
        />
      </Modal>

      <Modal
        title={t('注销账号')}
        open={closeOpen}
        onCancel={() => setCloseOpen(false)}
        onOk={() => void handleCloseAccount()}
        confirmLoading={closeSubmitting}
        okText={t('确认注销')}
        okButtonProps={{ danger: true }}
      >
        <p>{t('确定要注销账号吗？注销后账号将被禁用，个人数据将删除或匿名化，且不可恢复，且无法再次登录。')}</p>
      </Modal>
    </div>
  );
}
