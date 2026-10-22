/**
 * 列表表单弹窗（命令式 add/edit Modal）
 *
 * 依据 FieldMapping 渲染 FieldControl，提交时 serializeSubmitModel 序列化。
 * 编辑模式自动回填行数据（mapDataToFormValues 按字段名大小写不敏感匹配，布尔串转布尔、多选转数组）。
 */
import { useEffect, useMemo, useState } from 'react';
import { App, Form, Modal, Row, Tabs } from 'antd';
import FormFieldItem from './FormFieldItem';
import { groupByCategory, hasCategory, mapDataToFormValues, serializeSubmitModel } from '@/utils/fieldControl';
import { t } from '@/i18n';
import { toFieldMeta, type FieldMeta } from '@/types/field';
import { getValueByKey, setValueByKey } from '@/utils/url';
import type { FieldMapping } from '@newlifex/field-mapping';
import { useAiFillForm } from '@/hooks/useAiFillForm';

export interface FormDialogProps {
  open: boolean;
  title?: string;
  mode: 'add' | 'edit';
  fields: FieldMapping[];
  /** 编辑时的行数据（含主键） */
  row?: Record<string, unknown> | null;
  apiPrefix?: string;
  submitting?: boolean;
  onSubmit?: (data: Record<string, unknown>) => Promise<void>;
  onCancel?: () => void;
}

export default function FormDialog({
  open,
  title = t('新增'),
  mode,
  fields,
  row,
  apiPrefix,
  submitting,
  onSubmit,
  onCancel,
}: FormDialogProps) {
  const { message } = App.useApp();
  const [form] = Form.useForm();
  // AI 填表：弹窗打开时监听 AiAssistant 派发的 cube:ai-fill-form 事件
  useAiFillForm(form, open);
  const [detail, setDetail] = useState<Record<string, unknown>>({});

  // 表单字段元数据（过滤主键与只读字段；编辑时主键已通过 setFieldsValue(row) 保留在表单中）
  const metas = useMemo(
    () =>
      fields
        .map((f) => toFieldMeta(f.field))
        .filter((f) => !f.primaryKey && !f.readOnly),
    [fields],
  );

  // 分组：字段带 Category 才按分类 Tabs 分组，否则平铺单页（字段少的页面一屏展示）
  const groups = useMemo(() => {
    if (!hasCategory(metas)) return null;
    return groupByCategory(metas);
  }, [metas]);

  // 打开时初始化表单值
  useEffect(() => {
    if (!open) return;
    form.resetFields();
    setDetail({});
    if (mode === 'edit' && row) {
      // 后端 camelCase 数据 → 表单字段名（PascalCase）大小写不敏感回填
      const values = mapDataToFormValues(row, fields.map((f) => toFieldMeta(f.field)));
      form.setFieldsValue(values);
      setDetail(values);
    }
  }, [open, mode, row, form, fields]);

  const handleOk = async () => {
    try {
      const values = await form.validateFields();
      const model = serializeSubmitModel(values, metas);
      // 编辑模式：主键字段未渲染为 Form.Item（metas 已过滤主键），validateFields 不一定返回主键；
      // 从行数据按主键字段名显式合并到 body，api-core 据此拼出 PUT {type}/{id}
      if (mode === 'edit' && row) {
        const pk = fields.find((f) => f.field.primaryKey)?.field.name;
        if (pk && getValueByKey(model, pk) === undefined) {
          const id = getValueByKey(row, pk);
          if (id !== undefined) setValueByKey(model, pk, id);
        }
      }
      await onSubmit?.(model);
    } catch (err) {
      // 校验失败或提交失败
      if ((err as Error)?.message) message.error((err as Error).message);
    }
  };

  // 上传关联的主记录主键（编辑模式从行数据按主键字段名取值，避免假设主键是行对象首字段）
  const recordId =
    mode === 'edit' && row
      ? (getValueByKey(row, fields.find((f) => f.field.primaryKey)?.field.name ?? 'id') as number | string | undefined)
      : undefined;

  /** 渲染一组字段栅格（分组内 / 平铺共用，label|控件|description 同排） */
  const renderFields = (list: FieldMeta[]) => (
    <Row gutter={16}>
      {list.map((meta) => (
        <FormFieldItem key={meta.name} field={meta} apiPrefix={apiPrefix} recordId={recordId} />
      ))}
    </Row>
  );

  return (
    <Modal
      open={open}
      title={title}
      onOk={() => void handleOk()}
      onCancel={onCancel}
      confirmLoading={submitting}
      okText={t('保存')}
      cancelText={t('取消')}
      width={800}
      destroyOnHidden
      // 高度自适应：内容少时模态窗贴合内容，接近视口上限才出现滚动条；overflowX 兜底横向溢出
      styles={{ body: { maxHeight: 'calc(100vh - 240px)', overflowY: 'auto', overflowX: 'hidden' } }}
    >
      <Form form={form} layout="vertical" requiredMark={false} style={{ marginTop: 16 }}>
        {groups ? (
          <Tabs
            items={groups.map((g) => ({
              key: g.category,
              label: g.category,
              // forceRender：非激活分组表单项也注册进 Form，跨 Tab 必填校验生效
              forceRender: true,
              children: renderFields(g.fields),
            }))}
          />
        ) : (
          renderFields(metas)
        )}
      </Form>
    </Modal>
  );
}
