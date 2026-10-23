/**
 * 字段 → 控件 统一映射（对齐 Vue 皮肤 core/utils/fieldControl.ts，React 版）
 *
 * 规则（优先级）：
 *   1. ItemType 优先于 TypeName（后端显式声明想要的控件，如 image / json / color / mail …）
 *   2. Guid → readonly，且永不进搜索（主键 Id 仍走数值编辑）
 *   3. 枚举 / singleSelect / multipleSelect → 一律走 LOV（lovCode 由后端下发），单选 lov / 多选 lovMulti
 *   4. 数值（Int32/Int64/Decimal/Double/Single）→ inputNumber
 *   5. 大文本（String 且 Length >= 300）→ textarea
 *   6. 未知类型兜底 input，永不白屏
 *
 * 本模块是列表页 / 表单页 / 表单弹窗共用的唯一映射函数，
 * 禁止在组件中再写本地 TYPE_TO_*_TYPE 映射。
 */
import type { WidgetType } from '@newlifex/field-mapping';
import type { FieldPresetPatch, PagePreset } from '@newlifex/page-logic';
import type { FieldMeta, ControlType, SearchControlType, ListControlType } from '@/types/field';
import { t } from '@/i18n';
import { getValueByKey } from '@/utils/url';

/** 数值类型集合 */
const NUMERIC_TYPES: ReadonlySet<string> = new Set([
  'Int32',
  'Int64',
  'Decimal',
  'Double',
  'Single',
  'Int16',
  'Byte',
  'UInt32',
  'UInt64',
  'SByte',
]);

/** 已知基元类型集合。不在其中的 typeName 视为枚举（选项由后端 dataSource 下发，对齐 MVC _Form_Int） */
const PRIMITIVE_TYPES: ReadonlySet<string> = new Set([
  ...NUMERIC_TYPES,
  'String',
  'Boolean',
  'DateTime',
  'TimeSpan',
  'Guid',
  'Enum',
]);

/**
 * 是否纯日期字段（itemType=date，或字段名以 Date/day 结尾且无 itemType，对齐 MVC _Form_DateTime）
 *
 * @param field 字段元数据
 * @returns 是否纯日期（不带时间）
 */
export function isDateOnlyField(field: FieldMeta): boolean {
  const itemType = normalizeItemType(field);
  if (itemType === 'date') return true;
  if (itemType) return false;
  return /(date|day)$/i.test(field.name);
}

/** ItemType（小写） → 表单控件类型 的精确映射表（唯一真理表） */
const ITEM_TYPE_TO_CONTROL: Record<string, ControlType> = {
  file: 'upload',
  image: 'image',
  json: 'json',
  html: 'richHtml',
  markdown: 'richMarkdown',
  color: 'color',
  icon: 'icon',
  mail: 'email',
  mobile: 'tel',
  url: 'url',
  textarea: 'textarea',
  singleselect: 'lov',
  multipleselect: 'lovMulti',
  lovtable: 'lov',
  lovtablemulti: 'lovMulti',
  password: 'input',
  time: 'timePicker',
  date: 'date',
  // 省市区级联选择：area1=省、area2=省/市、area3=省/市/区、area4=省/市/区/乡镇街道（对齐 MVC _Area1~_Area4）
  area1: 'areaCascader',
  area2: 'areaCascader',
  area3: 'areaCascader',
  area4: 'areaCascader',
  // 数值类：percent/money/decimal 都用数值输入，仅列表展示时格式化
  percent: 'inputNumber',
  percentage: 'inputNumber',
  money: 'inputNumber',
  decimal: 'inputNumber',
  // 压缩包附件（下载链接同 file）
  'file-zip': 'upload',
};

/** 解析 ItemType 的基名（`decimal(18,2)` → `decimal`） */
function itemTypeBase(field: FieldMeta): string {
  const itemType = normalizeItemType(field);
  if (/^decimal\(/.test(itemType)) return 'decimal';
  return itemType;
}

/** 解析小写 ItemType */
function normalizeItemType(field: FieldMeta): string {
  return (field.itemType ?? '').trim().toLowerCase();
}

/**
 * 解析表单 / 编辑控件类型。
 *
 * @param field 字段元数据
 * @returns 控件类型（ControlType）
 */
export function resolveControl(field: FieldMeta): ControlType {
  // 1. ItemType 优先（decimal(p,s) 按基名识别）
  const itemType = itemTypeBase(field);
  if (itemType && ITEM_TYPE_TO_CONTROL[itemType]) {
    return ITEM_TYPE_TO_CONTROL[itemType];
  }

  const typeName = field.typeName;

  // 2. Guid → 只读（主键 Id 不在此列，仍走数值/主键编辑）
  if (typeName === 'Guid') {
    return 'readonly';
  }

  // 3. 枚举 / 单选 / 多选：lovCode 或 dataSource 由后端下发，统一走 LOV
  const hasOptions =
    !!field.lovCode || (field.dataSource != null && Object.keys(field.dataSource).length > 0);
  if (hasOptions) {
    // 多选：显式 multiple / multipleselect，或 dataSource 字段名以 s 结尾（对齐 MVC _Form_Item 约定）
    const multi =
      field.multiple ||
      itemType === 'multipleselect' ||
      itemType === 'lovtablemulti' ||
      (!!field.dataSource && /s$/i.test(field.name));
    return multi ? 'lovMulti' : 'lov';
  }

  // 4. 已知 CLR 类型
  if (typeName === 'Boolean') return 'switch';
  if (typeName === 'DateTime') return isDateOnlyField(field) ? 'date' : 'datePicker';
  if (typeName === 'TimeSpan') return 'timePicker';
  if (NUMERIC_TYPES.has(typeName)) return 'inputNumber';

  // 枚举类型名（非标准基元，如 SexKinds，选项由后端 dataSource 下发）按 lov 渲染
  if (typeName === 'Enum' || (typeName && !PRIMITIVE_TYPES.has(typeName))) return 'lov';

  // 5. 字符串：大文本 → textarea
  if (typeName === 'String') {
    const len = field.length ?? 0;
    if (len >= 300) return 'textarea';
    return 'input';
  }

  // 6. 兜底：普通文本输入，永不白屏
  return 'input';
}

/**
 * 将 @newlifex/field-mapping 的 WidgetType 转为皮肤 ControlType（表单控件）。
 * 与 resolveControl 双轨一致：store 侧已按 widget 映射，此处透传。
 *
 * @param widget @newlifex/field-mapping 推断的组件类型
 * @returns 皮肤控件类型
 */
export function widgetToControl(widget: WidgetType): ControlType {
  const map: Record<WidgetType, ControlType> = {
    text: 'input',
    textarea: 'textarea',
    number: 'inputNumber',
    select: 'lov',
    checkbox: 'switch',
    switch: 'switch',
    date: 'date',
    datetime: 'datePicker',
    time: 'timePicker',
    password: 'input',
    readonly: 'readonly',
    link: 'readonly',
    image: 'image',
    file: 'upload',
    email: 'email',
    phone: 'tel',
    url: 'url',
    color: 'color',
    code: 'json',
    html: 'richHtml',
    markdown: 'richMarkdown',
    json: 'json',
    icon: 'icon',
    lov: 'lov',
    lovMulti: 'lovMulti',
  };
  return map[widget] ?? 'input';
}

/**
 * 解析省市区级联选择器的最大层级。
 *
 * 后端 ItemType 约定：area1=省、area2=省/市、area3=省/市/区、area4=省/市/区/乡镇街道（对齐 MVC _Area1~_Area4）；
 * 未识别或未指定时默认 3 级（省/市/区）。
 *
 * @param field 字段元数据
 * @returns 最大层级 1~4
 */
export function resolveAreaMaxLevel(field: FieldMeta): number {
  const m = /^area([1-4])$/i.exec((field.itemType ?? '').trim());
  return m ? Number(m[1]) : 3;
}

/**
 * 解析动态搜索控件类型。
 *
 * @param field 字段元数据（Guid / 主键已在上游过滤，不会进入搜索）
 * @returns 搜索控件类型（SearchControlType）
 */
export function resolveSearchControl(field: FieldMeta): SearchControlType {
  const itemType = itemTypeBase(field);

  // ItemType 优先
  if (itemType === 'file' || itemType === 'image' || itemType === 'file-zip') return 'fileExists';
  if (itemType === 'singleselect') return 'lov';
  if (itemType === 'multipleselect') return 'lovMulti';
  if (itemType === 'lovtable') return 'lov';
  if (itemType === 'lovtablemulti') return 'lovMulti';

  // 省市区级联选择（itemType=area1~4，层级由后缀指定）
  if (/^area[1-4]$/.test(itemType)) return 'areaCascader';

  const typeName = field.typeName;

  // Guid / 主键：上游已过滤，这里兜底不进搜索
  if (typeName === 'Guid') return 'text';

  // 枚举 / 单选 / 多选：lovCode 或 dataSource（数据字典）→ 下拉。
  // 多选：显式 multiple / multipleselect，或 dataSource 字段名以 s 结尾（对齐 resolveControl 与 MVC _Form_Item 约定）
  const hasOptions =
    !!field.lovCode || (field.dataSource != null && Object.keys(field.dataSource).length > 0);
  if (hasOptions) {
    const multi =
      field.multiple ||
      itemType === 'multipleselect' ||
      itemType === 'lovtablemulti' ||
      (!!field.dataSource && /s$/i.test(field.name));
    return multi ? 'lovMulti' : 'lov';
  }

  // 已知 CLR 类型
  if (typeName === 'Boolean') return 'switch';
  if (typeName === 'DateTime') return isDateOnlyField(field) ? 'dateRange' : 'datetimeRange';
  if (typeName === 'TimeSpan') return 'timeRange';
  if (NUMERIC_TYPES.has(typeName)) return 'numberRange';

  // 枚举类型名（非标准基元，如 SexKinds，选项由后端 dataSource 下发）→ 下拉
  if (typeName === 'Enum' || (typeName && !PRIMITIVE_TYPES.has(typeName))) return 'lov';

  // 默认模糊文本
  return 'text';
}

/**
 * 解析列表单元格渲染类型。
 *
 * @param field 字段元数据
 * @returns 列表渲染类型（ListControlType）
 */
export function resolveListControl(field: FieldMeta): ListControlType {
  const itemType = itemTypeBase(field);

  // ItemType 优先
  switch (itemType) {
    case 'image':
      return 'image';
    case 'file':
    case 'file-zip':
      return 'file';
    case 'percent':
    case 'percentage':
      return 'percent';
    case 'money':
      return 'money';
    case 'decimal':
      return 'decimal';
    case 'color':
      return 'color';
    case 'icon':
      return 'icon';
    case 'json':
      return 'json';
    case 'html':
    case 'markdown':
      return 'html';
    case 'mail':
    case 'mobile':
    case 'url':
      return 'text';
    case 'singleselect':
    case 'multipleselect':
      return 'lov';
  }

  const typeName = field.typeName;

  if (typeName === 'Guid') return 'readonly';
  if (typeName === 'Boolean') return 'boolean';
  if (typeName === 'DateTime') return 'date';
  if (typeName === 'TimeSpan') return 'time';
  if (NUMERIC_TYPES.has(typeName)) return 'number';

  // 枚举 / LOV（真实枚举类型名如 SexKinds 也按 LOV 渲染）
  if (field.lovCode || typeName === 'Enum' || (typeName && !PRIMITIVE_TYPES.has(typeName))) return 'lov';

  // 默认文本
  return 'text';
}

/** 默认分组名（无分类字段归入） */
export const defaultCategory = () => t('常规设置');

/** 字段分组 */
export interface FieldGroup {
  /** 分类名 */
  category: string;
  /** 该分类下的字段 */
  fields: FieldMeta[];
}

/**
 * 是否存在分类字段（决定表单是否按分类分组展示）
 *
 * 表单视图（FormDialog / FormPage / DetailDialog）据此决定是否分组：
 * 任一字段带非空 category 即分组，全部无分类则平铺单页展示。
 *
 * @param fields 字段元数据
 * @returns 是否存在非空分类
 */
export function hasCategory(fields: FieldMeta[]): boolean {
  return fields.some((f) => !!f.category?.trim());
}

/**
 * 按分类分组字段（无分类字段归入「常规设置」组；保持原有顺序）
 *
 * 与后端 FieldCollection.GroupByCategory 语义一致，前端统一入口：
 * ConfigPage 配置页固定分组，实体表单视图仅当分组模式需要时调用。
 *
 * @param fields 字段元数据
 * @returns 按分类分组结果
 */
export function groupByCategory(fields: FieldMeta[]): FieldGroup[] {
  const map = new Map<string, FieldMeta[]>();
  for (const f of fields) {
    const cat = f.category?.trim() || defaultCategory();
    if (!map.has(cat)) map.set(cat, []);
    map.get(cat)!.push(f);
  }
  return [...map.entries()].map(([category, list]) => ({ category, fields: list }));
}

/** 表单分组方式 */
export type FormGroupMode = 'flat' | 'sections' | 'tabs';

/** 表单布局 */
export interface FormLayout {
  /** 分流方式 */
  mode: FormGroupMode;
  /** 列数（1/2/3） */
  columns: 1 | 2 | 3;
}

/** 自动分组阈值：字段数与分类数超过时改用 Tabs（字段多时区块过长） */
export const FORM_SECTION_MAX_FIELDS = 24;
export const FORM_SECTION_MAX_CATEGORIES = 3;

/**
 * 解析表单布局（呈现架构 §4.4 + FORM-9）。
 *
 * 默认 `groupBy: auto`：分类 ≤1 平铺；分类 2~3 且字段 ≤24 用分区区块；
 * 分类更多或字段更多自动切 Tabs。preset `form.groupBy` 可覆盖为 flat/sections/tabs。
 *
 * @param fields 表单字段
 * @param form preset 的 form 段（可空）
 * @returns 分流方式与列数
 */
export function resolveFormLayout(fields: FieldMeta[], form?: PagePreset['form'] | null): FormLayout {
  const categories = new Set<string>();
  for (const f of fields) {
    const cat = f.category?.trim();
    if (cat) categories.add(cat);
  }

  const setting = form?.groupBy ?? 'auto';
  let mode: FormGroupMode;
  if (setting !== 'auto') mode = setting === 'category' ? 'sections' : setting;
  else if (categories.size <= 1) mode = 'flat';
  else if (categories.size <= FORM_SECTION_MAX_CATEGORIES && fields.length <= FORM_SECTION_MAX_FIELDS) mode = 'sections';
  else mode = 'tabs';

  return { mode, columns: form?.columns ?? 2 };
}

/**
 * 按字段名查 preset 补丁（大小写不敏感）
 *
 * @param patch preset.form.patch / preset.list.patch
 * @param name 字段名
 * @returns 字段补丁；未命中返回 undefined
 */
export function findPresetPatch(
  patch: Record<string, FieldPresetPatch> | undefined,
  name: string,
): FieldPresetPatch | undefined {
  if (!patch) return undefined;
  const key = Object.keys(patch).find((k) => k.toLowerCase() === name.toLowerCase());
  return key ? patch[key] : undefined;
}

/**
 * 解析字段描述（对齐 MVC _Form_Item 的裁剪逻辑）
 *
 * 实体字段的 Description 常以 DisplayName 开头并附标点（如「名称。名称说明」），
 * 表单同排展示时裁剪该前缀与首部标点，避免与标签重复。
 *
 * @param field 字段元数据
 * @returns 裁剪后的描述（无可展示内容返回空串）
 */
export function resolveDescription(field: FieldMeta): string {
  let des = field.description?.trim() ?? '';
  const dn = field.displayName?.trim();
  if (dn && des.startsWith(dn)) des = des.slice(dn.length);
  des = des.replace(/^[.。，,;；:：\r\n\s]+/, '');
  return des;
}

/** 表单全宽控件（占满整行） */
const FULL_WIDTH_CONTROLS: ReadonlySet<ControlType> = new Set([
  'textarea',
  'json',
  'richHtml',
  'richMarkdown',
  'upload',
  'image',
  'lovMulti',
]);

/** 判断某控件是否应占满整行 */
export function isFullWidthControl(control: ControlType): boolean {
  return FULL_WIDTH_CONTROLS.has(control);
}

/**
 * 推导数值控件的小数精度。
 *
 * 规则（与后端约定一致）：
 *   - 后端返回了有效精度（scale > 0）→ 直接用返回的精度；
 *   - 后端返回 0 精度或根本没下发 scale → 按 CLR 类型给默认精度：
 *       · 单精度 Single → 4 位；双精度 Double → 8 位；十进制 Decimal → 2 位；整数 → 0 位
 *   - 未识别类型兜底 undefined（不限制）。
 *
 * @param field 字段元数据
 * @returns 小数位数（0=整数），undefined 表示不限制
 */
export function resolveNumberPrecision(field: FieldMeta): number | undefined {
  const scale = field.scale ?? 0;
  if (scale > 0) return scale;

  switch (field.typeName) {
    case 'Single':
      return 4;
    case 'Double':
      return 8;
    case 'Decimal':
      return 2;
    default:
      return undefined;
  }
}

/**
 * 提交前序列化：将多选字段（后端以 String 列存储）的 string[] 合并为逗号分隔字符串，
 * 避免 System.Text.Json 将数组绑定到 String 属性时报错。
 *
 * 判定多选：field.multiple 为 true，或 itemType 为 'multipleSelect'（lovMulti 控件来源）。
 * 仅当值为数组时才合并，其它类型原样透传。
 *
 * @param model 表单数据对象
 * @param fields 字段元数据（用于判定哪些字段是多选）
 * @returns 序列化后的提交对象（多选字段已转为逗号分隔字符串）
 */
export function serializeSubmitModel(
  model: Record<string, unknown>,
  fields: FieldMeta[],
): Record<string, unknown> {
  const multiNames = new Set(
    fields
      .filter((f) => f.multiple || (f.itemType ?? '').toLowerCase() === 'multipleselect')
      .map((f) => f.name.toLowerCase()),
  );
  // 虚拟字段（virtual=true）仅用于界面交互，不参与实体提交
  const virtualNames = new Set(fields.filter((f) => f.virtual).map((f) => f.name.toLowerCase()));
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(model)) {
    if (virtualNames.has(k.toLowerCase())) continue;
    if (multiNames.has(k.toLowerCase()) && Array.isArray(v)) {
      out[k] = (v as unknown[]).map(String).join(',');
    } else {
      out[k] = v;
    }
  }
  return out;
}

/**
 * 多选值归一为 string[]（对齐 Vue 皮肤 toMultiArray）
 *
 * 兼容三种来源：
 * - 数组（表单编辑中 LovSelect 直接回写的 string[]）
 * - 逗号分隔字符串（后端 String 列存储格式，如 "1,2"）
 * - JSON 字符串（如 '["1","2"]'）
 *
 * @param val 原始值
 * @returns 字符串数组
 */
function toMultiArray(val: unknown): string[] {
  if (val == null) return [];
  if (Array.isArray(val)) return val.filter((x) => x != null).map(String);
  const s = String(val).trim();
  if (!s) return [];
  try {
    const parsed = JSON.parse(s);
    if (Array.isArray(parsed)) return parsed.filter((x: unknown) => x != null).map(String);
  } catch {
    /* 非 JSON，按逗号拆分 */
  }
  return s
    .split(',')
    .map((x) => x.trim())
    .filter((x) => x.length > 0);
}

/**
 * 编辑回填：将后端 camelCase 数据（列表行/详情）映射为表单字段值（PascalCase 字段名）
 *
 * 后端实体 JSON 序列化为 camelCase（如 { id, name, displayName, enable }），
 * 而 meta 下发的 DataField.name 为 PascalCase 实体属性名（如 ID/Name/DisplayName）。
 * 若直接用 form.setFieldsValue(data) 精确匹配，camelCase 键与 PascalCase 字段名对不上，
 * 编辑表单将全部为空（旧版问题：三方登录用户数据多时编辑完全看不到数据）。
 *
 * 归一规则：
 * - 按字段名大小写不敏感取值（复用 getValueByKey，兼容 ID↔id）；
 * - 布尔串 'true'/'false' → boolean（Enable 等）；
 * - 多选字段（multiple / itemType=multipleselect）逗号/JSON 字符串 → string[]（LovSelect 多选展示）。
 *
 * @param data 后端数据对象（列表行或详情）
 * @param fields 表单字段元数据（建议传全量字段，含主键，保证主键也进入表单 store）
 * @returns 以字段名为键的表单值
 */
export function mapDataToFormValues(data: Record<string, unknown>, fields: FieldMeta[]): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const f of fields) {
    const v = getValueByKey(data, f.name);
    if (v === undefined) continue;
    let val: unknown = v === 'true' ? true : v === 'false' ? false : v;
    if (f.multiple || (f.itemType ?? '').toLowerCase() === 'multipleselect') {
      val = toMultiArray(val);
    }
    out[f.name] = val;
  }
  return out;
}

/**
 * 把 URL 查询参数映射为搜索控件值（外部跳转携带查询条件，如工作台指标卡跳转日志页）
 *
 * 后端 URL 参数名（`dtStart`/`dtEnd`/`success=false` 等，MVC 老约定）与 React 搜索字段名
 * （`CreateTime` 数组、`Success` 布尔）不一致，需按搜索字段元数据做映射：
 * - 时间范围字段（dateRange/datetimeRange）：URL `dtStart`/`dtEnd` 或 `{字段}Start`/`{字段}End` → [start, end]
 * - 布尔字段（switch）：URL `success` 或字段名小写 → true/false
 * - 其余字段：URL 参数名与字段名大小写不敏感匹配 → 原值
 *
 * @param params URL 查询参数对象（parseUrlQuery 结果）
 * @param fields 搜索字段元数据
 * @returns 以搜索字段名为键的控件值对象，供 SearchBar 回显
 * @example
 * mapUrlParamsToSearchValues({ dtStart: '2026-08-01', dtEnd: '2026-08-31', success: 'false' }, logSearchFields)
 * // => { CreateTime: ['2026-08-01', '2026-08-31'], Success: false }
 */
export function mapUrlParamsToSearchValues(
  params: Record<string, unknown>,
  fields: FieldMeta[],
): Record<string, unknown> {
  const rs: Record<string, unknown> = {};
  const lower = (s: string) => s.toLowerCase();
  // 小写键映射，支持大小写不敏感匹配
  const lowerMap = new Map(Object.entries(params).map(([k, v]) => [lower(k), v]));

  for (const f of fields) {
    const control = resolveSearchControl(f);
    const name = f.name;
    const lk = lower(name);

    // 区间查询项（kind=range）：/meta 已把主时间字段收敛为 name/end 两参，直接组成 [start, end]
    if (f.kind === 'range') {
      const start = params[name] ?? lowerMap.get(lk);
      const endKey = f.end ?? `${name}End`;
      const end = params[endKey] ?? lowerMap.get(lower(endKey));
      if (start != null || end != null) rs[name] = [start ?? undefined, end ?? undefined];
      continue;
    }

    if (control === 'dateRange' || control === 'datetimeRange') {
      // 时间范围：优先 dtStart/dtEnd（后端老参数），其次 {字段}Start/{字段}End
      const start = lowerMap.get('dtstart') ?? lowerMap.get(`${lk}start`);
      const end = lowerMap.get('dtend') ?? lowerMap.get(`${lk}end`);
      if (start != null || end != null) {
        rs[name] = [start != null ? String(start) : null, end != null ? String(end) : null];
      }
      continue;
    }

    if (control === 'switch') {
      // 布尔：URL 用 success 或字段名小写
      const v = lowerMap.get('success') ?? lowerMap.get(lk);
      if (v != null) rs[name] = v === true || v === 'true' || v === '1';
      continue;
    }

    // 其余字段：URL 参数名与字段名大小写不敏感匹配
    if (lowerMap.has(lk)) {
      const v = lowerMap.get(lk);
      // lovMulti 多选（角色/部门等）：逗号串 → 数组
      if (control === 'lovMulti' && typeof v === 'string') rs[name] = v.split(',');
      else rs[name] = v;
    }
  }
  return rs;
}
