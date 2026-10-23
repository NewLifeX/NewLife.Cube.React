/**
 * 表单表单项（label | 控件 | description 同排三栏，对齐 MVC _Form_Item）
 *
 * 供 FormDialog / FormPage / ConfigPage 共用：
 * - Form.Item 直接包裹 FieldControl，保证 value/onChange 注入与表单状态联动；
 * - 标签与描述列由 CSS Grid 同排布局（见 styles/entity.css `.cube-form-inline-*`）；
 * - 描述列仅当裁剪后非空时渲染，单行省略、悬浮显示完整；
 * - 必填/邮箱/手机校验规则内聚于此，视图无需重复构建。
 */
import { Col, Form } from 'antd';
import type { RuleObject } from 'antd/es/form';
import FieldControl from '@/components/field/FieldControl';
import { t } from '@/i18n';
import { isFullWidthControl, resolveControl, resolveDescription } from '@/utils/fieldControl';
import type { FieldMeta } from '@/types/field';
import { useReactSetting } from '@/stores/reactSetting';

export interface FormFieldItemProps {
  /** 字段元数据 */
  field: FieldMeta;
  /** 实体路径前缀（上传需要，如 '/Admin/User'） */
  apiPrefix?: string;
  /** 主记录主键（上传需要，0=新增） */
  recordId?: number | string;
  /** 表单列数（1/2/3，默认 2） */
  columns?: 1 | 2 | 3;
  /** 必填覆盖（preset.requiredWhen 的结果；未传时用字段自身 required） */
  required?: boolean;
}

/** 构建字段校验规则（必填 + 邮箱/手机格式） */
function buildRules(meta: FieldMeta, required?: boolean): RuleObject[] {
  const rules: RuleObject[] = [];
  const label = meta.displayName || meta.name;
  if (required ?? meta.required) {
    rules.push({ required: true, message: t('请输入{{name}}', { name: label }) });
  }
  if (meta.itemType === 'mail') {
    rules.push({ type: 'email', message: t('邮箱格式不正确') });
  }
  if (meta.itemType === 'mobile') {
    rules.push({ pattern: /^1\d{10}$/, message: t('手机号格式不正确') });
  }
  return rules;
}

export default function FormFieldItem({ field, apiPrefix, recordId, columns = 2, required }: FormFieldItemProps) {
  const control = resolveControl(field);
  const fullWidth = isFullWidthControl(control);
  const displayName = field.displayName || field.name;
  const desc = resolveDescription(field);
  // React 皮肤设置：表单风格（inline-三栏同排 / vertical-标签一行控件一行）与注释显示方式
  const { formStyle, descMode } = useReactSetting();
  // 级联：父字段（parentField）当前值 → LovSelect 子字典过滤
  const form = Form.useFormInstance();
  const allValues = Form.useWatch([], form) as Record<string, unknown> | undefined;
  const parentValue = field.parentField && allValues ? allValues[field.parentField] : undefined;
  const span = fullWidth ? 24 : Math.floor(24 / columns);

  // antd6 风格：标签一行 + 控件一行，注释小字跟在标签后（descMode=1）或问号图标悬浮（descMode=2）
  if (formStyle === 'vertical') {
    const labelNode =
      desc && descMode === 1 ? (
        <span className="cube-form-vertical-label">
          {displayName}
          <span className="cube-form-vertical-desc">{desc}</span>
        </span>
      ) : (
        displayName
      );
    return (
      <Col span={span}>
        <Form.Item
          name={field.name}
          label={labelNode}
          tooltip={descMode === 2 && desc ? desc : undefined}
          rules={buildRules(field, required)}
          className="cube-form-vertical-item"
        >
          <FieldControl field={field} apiPrefix={apiPrefix} recordId={recordId} parent={parentValue} />
        </Form.Item>
      </Col>
    );
  }

  // MVC 风格：label | 控件 | description 同排三栏
  const cls = [
    'cube-form-inline-cell',
    desc ? 'cube-form-inline-cell--desc' : '',
    fullWidth ? 'cube-form-inline-cell--top' : '',
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <Col span={span}>
      <div className={cls}>
        <label className="cube-form-inline-label" title={displayName}>
          {displayName}
        </label>
        <Form.Item name={field.name} rules={buildRules(field, required)} className="cube-form-inline-control">
          <FieldControl field={field} apiPrefix={apiPrefix} recordId={recordId} parent={parentValue} />
        </Form.Item>
        {desc && (
          <div className="cube-form-inline-desc" title={desc}>
            {desc}
          </div>
        )}
      </div>
    </Col>
  );
}
