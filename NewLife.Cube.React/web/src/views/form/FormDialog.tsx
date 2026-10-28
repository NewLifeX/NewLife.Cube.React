/**
 * 列表表单弹窗（命令式 add/edit Modal）
 *
 * 依据 FieldMapping 渲染 FieldControl，提交时 serializeSubmitModel 序列化。
 * 编辑模式自动回填行数据（mapDataToFormValues 按字段名大小写不敏感匹配，布尔串转布尔、多选转数组）。
 */
import { useEffect, useMemo, useState } from 'react';
import { App, Form, Modal, Row, Tabs } from 'antd';
import FormFieldItem from './FormFieldItem';
import { groupByCategory, findPresetPatch, mapDataToFormValues, resolveFormLayout, serializeSubmitModel } from '@/utils/fieldControl';
import { t } from '@/i18n';
import { toFieldMeta, type FieldMeta } from '@/types/field';
import { getValueByKey, setValueByKey } from '@/utils/url';
import type { FieldMapping, PagePreset } from '@newlifex/cube';
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
  /** 页面呈现配置的表单段（列数/分组/字段补丁） */
  formPreset?: PagePreset['form'] | null;
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
  formPreset,
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

  // 表单布局：preset 覆盖优先，否则按 auto 规则（≤1 分类平铺；2~3 分类且 ≤24 字段分区；否则 Tabs）
  const layout = useMemo(() => resolveFormLayout(metas, formPreset), [metas, formPreset]);
  // 条件显隐/必填（preset.visibleWhen / requiredWhen）
  const values = Form.useWatch([], form) as Record<string, unknown> | undefined;
  const visibleMetas = useMemo(
    () => metas.filter((m) => findPresetPatch(formPreset?.patch, m.name)?.visibleWhen?.(values ?? {}) !== false),
    [metas, formPreset, values],
  );
  const groups = useMemo(
    () => (layout.mode === 'flat' ? null : groupByCategory(visibleMetas)),
    [layout.mode, visibleMetas],
  );

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
        <FormFieldItem
          key={meta.name}
          field={meta}
          apiPrefix={apiPrefix}
          recordId={recordId}
          columns={layout.columns}
          required={findPresetPatch(formPreset?.patch, meta.name)?.requiredWhen?.(values ?? {})}
        />
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
        {layout.mode === 'tabs' && groups ? (
          <Tabs
            items={groups.map((g) => ({
              key: g.category,
              label: g.category,
              // forceRender：非激活分组表单项也注册进 Form，跨 Tab 必填校验生效
              forceRender: true,
              children: renderFields(g.fields),
            }))}
          />
        ) : layout.mode === 'sections' && groups ? (
          groups.map((g) => (
            <div key={g.category} className="cube-form-section">
              <div className="cube-form-section-title" style={{ fontWeight: 600, margin: '8px 0' }}>
                {g.category}
              </div>
              {renderFields(g.fields)}
            </div>
          ))
        ) : (
          renderFields(visibleMetas)
        )}
      </Form>
    </Modal>
  );
}
