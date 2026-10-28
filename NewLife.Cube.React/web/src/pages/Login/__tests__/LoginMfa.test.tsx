/**
 * 登录页 MFA 二步验证单元测试
 *
 * 覆盖共享包 MfaLoginLogic 的接入路径：
 * - 登录返回 `mfa_required:<token>` 时进入二步验证面板
 * - 验证成功持久化令牌并跳转
 * - 验证失败展示共享逻辑回填的错误且不跳转
 */
import { describe, expect, it, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { App as AntApp } from 'antd';
import LoginPage from '../index';

// ── 模块 Mock（vi.hoisted 保证 hoist 安全）────────────────────
const { mockLogin, mockMfaVerify, mockSetToken, mockNavigate } = vi.hoisted(() => ({
  mockLogin: vi.fn(),
  mockMfaVerify: vi.fn(),
  mockSetToken: vi.fn(),
  mockNavigate: vi.fn(),
}));

vi.mock('@/stores/user', () => ({
  useUserStore: { getState: () => ({ login: mockLogin }) },
}));

vi.mock('@/stores/menu', () => ({ useMenuStore: { getState: () => ({}) } }));

vi.mock('@/api', () => ({
  api: {
    user: { mfaVerify: mockMfaVerify, sendActivateCode: vi.fn() },
    tokenManager: { setToken: mockSetToken },
  },
}));

vi.mock('@/hooks/useLoginConfig', () => ({
  useLoginConfig: () => ({
    config: { login: { password: true }, security: {}, oauth: [] },
    loading: false,
    error: null,
  }),
  useCaptcha: () => ({ captcha: null, refresh: vi.fn() }),
}));

vi.mock('@/hooks/useSiteConfig', () => ({
  useSiteConfig: () => ({ config: { name: '魔方' } }),
}));

vi.mock('@/configure', () => ({
  getConfig: () => ({ auth: { redirectKey: 'redirect' }, base: { title: '魔方' } }),
}));

vi.mock('@/i18n', () => ({
  t: (key: string) => key,
  getCurrentLanguage: () => 'zh-CN',
}));

vi.mock('react-router-dom', () => ({
  useNavigate: () => mockNavigate,
  useSearchParams: () => [new URLSearchParams(), vi.fn()],
}));

vi.mock('@/components/auth/AuthLayout', () => ({
  default: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));

vi.mock('@/pages/Login/RegisterPanel', () => ({ default: () => null }));

/** 渲染登录页（包裹 antd App，提供 App.useApp() 上下文） */
function renderLogin() {
  return render(
    <AntApp>
      <LoginPage />
    </AntApp>,
  );
}

/** 提交密码登录表单 */
async function submitPasswordLogin(account = 'admin', password = '123456') {
  fireEvent.change(screen.getByPlaceholderText('用户名 / 邮箱 / 手机号'), { target: { value: account } });
  fireEvent.change(screen.getByPlaceholderText('请输入密码'), { target: { value: password } });
  // antd Button 会在两个汉字之间自动插入空格（登 录），断言用正则容忍
  fireEvent.click(screen.getByRole('button', { name: /^登\s*录$/ }));
}

describe('登录页 MFA 二步验证（共享 MfaLoginLogic）', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('登录返回 mfa_required 时进入验证面板，验证成功持久化令牌并跳转', async () => {
    mockLogin.mockResolvedValue({ message: 'mfa_required:tok-123', data: null });
    mockMfaVerify.mockResolvedValue({ data: { accessToken: 'access-abc' } });
    renderLogin();

    await submitPasswordLogin();
    const input = await screen.findByPlaceholderText('6 位动态验证码');
    expect(mockLogin).toHaveBeenCalledTimes(1);

    fireEvent.change(input, { target: { value: '123456' } });
    fireEvent.click(screen.getByRole('button', { name: /^验\s*证$/ }));

    await waitFor(() => expect(mockMfaVerify).toHaveBeenCalledWith({ mfaToken: 'tok-123', code: '123456' }));
    expect(mockSetToken).toHaveBeenCalledWith('access-abc', undefined);
    expect(mockNavigate).toHaveBeenCalledWith('/', { replace: true });
  });

  it('验证失败展示共享逻辑回填的错误，不持久化令牌也不跳转', async () => {
    mockLogin.mockResolvedValue({ message: 'mfa_required:tok-456', data: null });
    mockMfaVerify.mockRejectedValue(new Error('验证码错误，请重试'));
    renderLogin();

    await submitPasswordLogin();
    const input = await screen.findByPlaceholderText('6 位动态验证码');
    fireEvent.change(input, { target: { value: '000000' } });
    fireEvent.click(screen.getByRole('button', { name: /^验\s*证$/ }));

    expect(await screen.findByText('验证码错误，请重试')).toBeInTheDocument();
    expect(mockSetToken).not.toHaveBeenCalled();
    expect(mockNavigate).not.toHaveBeenCalled();
  });
});
