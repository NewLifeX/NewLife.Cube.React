/**
 * 通用表单页（对齐 Vue 皮肤 core/views/form.vue）
 *
 * 通过 URL 判定模式：
 * - `?id=123` → 编辑模式（加载详情）
 * - 无 id → 新增模式
 * 提交 POST/PUT 后返回上一页。
 */
import { useEffect, useMemo, useState } from 'react';
import { App, Button, Card, Form, Row, Space, Spin, Tabs } from 'antd';
import { ArrowLeftOutlined } from '@ant-design/icons';
import { useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import FormFieldItem from './FormFieldItem';
import { groupByCategory, findPresetPatch, mapDataToFormValues, resolveFormLayout, serializeSubmitModel } from '@/utils/fieldControl';
import { t } from '@/i18n';
import { routeToApiPrefix, getValueByKey, setValueByKey } from '@/utils/url';
import { toFieldMeta, type FieldMeta } from '@/types/field';
import { usePageStore } from '@/hooks/usePageStore';
import { useAiFillForm } from '@/hooks/useAiFillForm';

export interface FormPageProps {
  title?: string;
}

export default function FormPage({ title }: FormPageProps) {
  const { message } = App.useApp();
  const [form] = Form.useForm();
  // AI 填表：监听 AiAssistant 派发的 cube:ai-fill-form 事件
  useAiFillForm(form);
  const location = useLocation();
  const navigate = useNavigate();
  const [params] = useSearchParams();

  // 路径去掉 /Edit /Add 等后缀后作为 API 前缀
  const path = location.pathname.replace(/\/+(edit|add|new|detail)$/i, '');
  const type = routeToApiPrefix(path);
  const store = usePageStore(type);

  const isEdit = params.get('id') != null;
  const addFields = store((s) => s.addFields);
  const editFields = store((s) => s.editFields);
  const formLoading = store((s) => s.formLoading);
  const pagePreset = store((s) => s.preset);

  const [detailLoading, setDetailLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const fields = isEdit && editFields.length ? editFields : addFields;
  // 过滤主键与只读字段（编辑时主键已随详情 setFieldsValue 保留）
  const metas = useMemo(
    () => fields.map((f) => toFieldMeta(f.field)).filter((f) => !f.primaryKey && !f.readOnly),
    [fields],
  );

  // 表单布局：preset 覆盖优先，否则按 auto 规则（≤1 分类平铺；2~3 分类且 ≤24 字段分区；否则 Tabs）
  const layout = useMemo(() => resolveFormLayout(metas, pagePreset?.form), [metas, pagePreset]);
  // 条件显隐/必填（preset.visibleWhen / requiredWhen）
  const values = Form.useWatch([], form) as Record<string, unknown> | undefined;
  const visibleMetas = useMemo(
    () => metas.filter((m) => findPresetPatch(pagePreset?.form?.patch, m.name)?.visibleWhen?.(values ?? {}) !== false),
    [metas, pagePreset, values],
  );
  const groups = useMemo(
    () => (layout.mode === 'flat' ? null : groupByCategory(visibleMetas)),
    [layout.mode, visibleMetas],
  );

  // 加载字段 + 详情
  useEffect(() => {
    let cancelled = false;
    store
      .getState()
      .loadFields()
      .then(async () => {
        if (cancelled) return;
        if (isEdit) {
          const id = params.get('id')!;
          setDetailLoading(true);
          try {
            const detail = await store.getState().getDetail<Record<string, unknown>>(id);
            if (!cancelled) {
              // 后端 camelCase 数据 → 表单字段名（PascalCase）大小写不敏感回填
              form.setFieldsValue(mapDataToFormValues(detail, fields.map((f) => toFieldMeta(f.field))));
            }
          } catch {
            message.error(t('加载详情失败'));
          } finally {
            if (!cancelled) setDetailLoading(false);
          }
        }
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [type, isEdit, params.get('id')]);

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      const model = serializeSubmitModel(values, metas);
      // 编辑模式：主键字段未渲染为 Form.Item（metas 已过滤主键），validateFields 不一定返回主键；
      // 从路由 ?id= 显式合并到 body，api-core 据此拼出 PUT {type}/{id}（后端以路径主键为准）
      if (isEdit) {
        const pk = fields.find((f) => f.field.primaryKey)?.field.name;
        if (pk && getValueByKey(model, pk) === undefined) setValueByKey(model, pk, params.get('id') ?? '');
      }
      setSubmitting(true);
      if (isEdit) {
        await store.getState().update(model);
      } else {
        await store.getState().add(model);
      }
      message.success(isEdit ? t('更新成功') : t('新增成功'));
      navigate(-1);
    } catch (err) {
      if ((err as Error)?.message && !(err as Error)?.message.includes('validateFields')) {
        message.error((err as Error).message);
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Card
      className="cube-entity-card"
      title={
        <Space>
          <Button type="text" icon={<ArrowLeftOutlined />} onClick={() => navigate(-1)} />
          <span>{title || (isEdit ? t('编辑') : t('新增'))}</span>
        </Space>
      }
      size="small"
    >
      <Spin spinning={detailLoading || formLoading}>
        <Form form={form} layout="vertical" requiredMark={false} style={{ maxWidth: 900 }}>
          {layout.mode === 'tabs' && groups ? (
            <Tabs
              items={groups.map((g) => ({
                key: g.category,
                label: g.category,
                // forceRender：非激活分组表单项也注册进 Form，跨 Tab 必填校验生效
                forceRender: true,
                children: (
                  <Row gutter={16}>
                    {g.fields.map((meta: FieldMeta) => (
                      <FormFieldItem
                        key={meta.name}
                        field={meta}
                        apiPrefix={type}
                        columns={layout.columns}
                        required={findPresetPatch(pagePreset?.form?.patch, meta.name)?.requiredWhen?.(values ?? {})}
                      />
                    ))}
                  </Row>
                ),
              }))}
            />
          ) : layout.mode === 'sections' && groups ? (
            groups.map((g) => (
              <div key={g.category} className="cube-form-section">
                <div className="cube-form-section-title" style={{ fontWeight: 600, margin: '8px 0' }}>
                  {g.category}
                </div>
                <Row gutter={16}>
                  {g.fields.map((meta: FieldMeta) => (
                    <FormFieldItem
                      key={meta.name}
                      field={meta}
                      apiPrefix={type}
                      columns={layout.columns}
                      required={findPresetPatch(pagePreset?.form?.patch, meta.name)?.requiredWhen?.(values ?? {})}
                    />
                  ))}
                </Row>
              </div>
            ))
          ) : (
            <Row gutter={16}>
              {visibleMetas.map((meta) => (
                <FormFieldItem
                  key={meta.name}
                  field={meta}
                  apiPrefix={type}
                  columns={layout.columns}
                  required={findPresetPatch(pagePreset?.form?.patch, meta.name)?.requiredWhen?.(values ?? {})}
                />
              ))}
            </Row>
          )}
          <div className="cube-form-actions">
            <Button type="primary" loading={submitting} onClick={() => void handleSubmit()}>
              {t('保存')}
            </Button>
            <Button onClick={() => navigate(-1)}>{t('返回')}</Button>
          </div>
        </Form>
      </Spin>
    </Card>
  );
}
