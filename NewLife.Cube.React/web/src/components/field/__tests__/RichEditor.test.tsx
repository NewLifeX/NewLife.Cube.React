/**
 * RichEditor 富文本编辑器单元测试（E2 增强）
 *
 * 覆盖：markdown 编辑/预览切换（marked 渲染出 HTML 结构）、html 模式走 wangEditor WYSIWYG。
 * jsdom 无完整 Range/Selection 实现，wangEditor 以模块 mock 验证交互契约。
 */
import { describe, expect, it, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import RichEditor from '../RichEditor';

// wangEditor mock：jsdom 无法真实创建编辑器，用 vi.hoisted 提供可控实例
const h = vi.hoisted(() => {
  const editor = {
    getHtml: vi.fn(() => '<p>mock内容</p>'),
    setHtml: vi.fn(),
    destroy: vi.fn(),
    disable: vi.fn(),
    enable: vi.fn(),
  };
  const toolbar = { destroy: vi.fn() };
  return {
    editor,
    toolbar,
    createEditor: vi.fn(
      (opt?: {
        html?: string;
        selector?: unknown;
        config?: { placeholder?: string; onChange?: (editor: { getHtml(): string }) => void };
      }) => editor,
    ),
    createToolbar: vi.fn(() => toolbar),
  };
});

vi.mock('@wangeditor/editor', () => ({
  createEditor: h.createEditor,
  createToolbar: h.createToolbar,
}));

describe('RichEditor 富文本编辑器', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('markdown 模式渲染编辑/预览切换，预览用 marked 输出 HTML', () => {
    // JSX 属性中 \n 为字面量，需用 JS 表达式传入真实换行
    const md = '# 标题\n\n**加粗** 和 *斜体*';
    const { container } = render(<RichEditor markdown value={md} />);
    // 编辑模式为文本域
    expect(screen.getByRole('textbox')).toHaveValue(md);
    // 切到预览
    fireEvent.click(screen.getByText('预览'));
    const preview = container.querySelector('[data-preview]');
    expect(preview).not.toBeNull();
    const html = preview ? preview.innerHTML : '';
    expect(html).toContain('<h1');
    expect(html).toContain('<strong>');
    expect(html).toContain('<em>');
  });

  it('markdown 模式对脚本内容进行消毒（DOMPurify）', () => {
    const { container } = render(<RichEditor markdown value={'<script>alert(1)</script>安全文本'} />);
    fireEvent.click(screen.getByText('预览'));
    const preview = container.querySelector('[data-preview]');
    const html = preview ? preview.innerHTML : '';
    expect(html).not.toContain('<script');
    expect(html).toContain('安全文本');
  });

  it('html 模式用 wangEditor 创建编辑器并回填值', async () => {
    render(<RichEditor value="<p>富文本</p>" />);
    // createEditor 携带初始 html
    const option = h.createEditor.mock.calls[0][0];
    expect(option?.html).toContain('富文本');
    expect(option?.selector).toBeTruthy();
    // 工具栏同步创建
    expect(h.createToolbar).toHaveBeenCalledTimes(1);
    // 编辑器容器渲染
    expect(h.editor.destroy).not.toHaveBeenCalled();
    await waitFor(() => {});
  });

  it('html 模式编辑器 onChange 回传 getHtml()', async () => {
    const onChange = vi.fn();
    render(<RichEditor value="<p>x</p>" onChange={onChange} />);
    const config = h.createEditor.mock.calls[0][0]?.config;
    // 模拟编辑器内容变化 → onChange 应携带 getHtml() 结果
    config?.onChange?.(h.editor as never);
    expect(onChange).toHaveBeenCalledWith('<p>mock内容</p>');
  });

  it('html 模式外部 value 变化时同步 setHtml（不一致才同步）', async () => {
    const { rerender } = render(<RichEditor value="<p>a</p>" />);
    // 外部值变化且与编辑器当前值不一致 → setHtml
    h.editor.getHtml.mockReturnValue('<p>a</p>');
    rerender(<RichEditor value="<p>b</p>" />);
    await waitFor(() => expect(h.editor.setHtml).toHaveBeenCalledWith('<p>b</p>'));
  });

  it('html 模式禁用态透传 editor.disable', async () => {
    render(<RichEditor disabled value="x" />);
    await waitFor(() => expect(h.editor.disable).toHaveBeenCalled());
  });
});
