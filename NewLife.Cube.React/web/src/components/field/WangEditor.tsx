/**
 * wangEditor 富文本编辑器（React 封装，html 模式）
 *
 * 用 @wangeditor/editor 核心包 + 自写 React 包裹（规避 editor-for-react 与 React19 的 peer 依赖冲突）：
 * - useEffect 中 createEditor/createToolbar 挂载到容器 ref，卸载时 destroy 释放；
 * - onChange 回传 editor.getHtml()；外部 value 变化仅在不一致时 setHtml，避免输入时光标跳动；
 * - disabled 透传 editor.disable()/enable()。
 */
import { useEffect, useRef } from 'react';
import { createEditor, createToolbar } from '@wangeditor/editor';
import type { IDomEditor, IEditorConfig, IToolbarConfig } from '@wangeditor/editor';
import '@wangeditor/editor/dist/css/style.css';

export interface WangEditorProps {
  value?: string;
  onChange?: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
}

export default function WangEditor({ value, onChange, placeholder, disabled }: WangEditorProps) {
  const toolbarRef = useRef<HTMLDivElement>(null);
  const editorRef = useRef<HTMLDivElement>(null);
  const instRef = useRef<{ editor: IDomEditor; toolbar: ReturnType<typeof createToolbar> } | null>(null);

  // 挂载：创建编辑器与工具栏，卸载时销毁
  useEffect(() => {
    if (!toolbarRef.current || !editorRef.current) return;
    const config: Partial<IEditorConfig> = {
      placeholder,
      onChange: (editor) => onChange?.(editor.getHtml()),
    };
    const editor = createEditor({
      selector: editorRef.current,
      html: value || '<p><br></p>',
      config,
      mode: 'default',
    });
    const toolbar = createToolbar({
      editor,
      selector: toolbarRef.current,
      config: {},
      mode: 'default',
    });
    if (disabled) editor.disable();
    instRef.current = { editor, toolbar };
    return () => {
      toolbar.destroy();
      editor.destroy();
      instRef.current = null;
    };
    // 仅在挂载时创建一次，value/onChange 由后续 effect 同步
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // 外部 value → 编辑器（仅不一致时同步，避免输入循环与光标跳动）
  useEffect(() => {
    const editor = instRef.current?.editor;
    if (editor && value != null && editor.getHtml() !== value) {
      editor.setHtml(value || '<p><br></p>');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

  // 禁用态
  useEffect(() => {
    const editor = instRef.current?.editor;
    if (!editor) return;
    if (disabled) {
      editor.disable();
    } else {
      editor.enable();
    }
  }, [disabled]);

  return (
    <div style={{ border: '1px solid #d9d9d9', borderRadius: 6, background: '#fff', overflow: 'hidden' }}>
      <div ref={toolbarRef} style={{ borderBottom: '1px solid #d9d9d9' }} />
      <div ref={editorRef} style={{ minHeight: 200 }} />
    </div>
  );
}
