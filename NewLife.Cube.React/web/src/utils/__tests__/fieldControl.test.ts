/**
 * 字段控件映射单元测试（对齐 Vue 皮肤 fieldControl 测试）
 */
import { describe, expect, it } from 'vitest';
import {
  defaultCategory,
  groupByCategory,
  hasCategory,
  isDateOnlyField,
  mapDataToFormValues,
  resolveControl,
  resolveDescription,
  resolveSearchControl,
  resolveListControl,
  widgetToControl,
  serializeSubmitModel,
  resolveNumberPrecision,
  isFullWidthControl,
  resolveAreaMaxLevel,
  mapUrlParamsToSearchValues,
  resolveFormLayout,
  findPresetPatch,
} from '@/utils/fieldControl';
import { toFieldMeta } from '@/types/field';
import type { FieldMeta } from '@/types/field';
import type { DataField } from '@newlifex/api-core';

function f(partial: Partial<DataField>): FieldMeta {
  return toFieldMeta({ name: 'F', typeName: 'String', ...partial });
}

describe('ItemType 数值/压缩包映射（META-7）', () => {
  it('percent / money / decimal 表单控件为数值输入', () => {
    expect(resolveControl(f({ itemType: 'percent', typeName: 'Double' }))).toBe('inputNumber');
    expect(resolveControl(f({ itemType: 'Percentage', typeName: 'Int32' }))).toBe('inputNumber');
    expect(resolveControl(f({ itemType: 'money', typeName: 'Decimal' }))).toBe('inputNumber');
    expect(resolveControl(f({ itemType: 'decimal(18,2)', typeName: 'Decimal' }))).toBe('inputNumber');
  });

  it('file-zip 表单控件为上传', () => {
    expect(resolveControl(f({ itemType: 'file-zip' }))).toBe('upload');
  });

  it('列表控件区分 percent / money / decimal，file-zip 走文件链接', () => {
    expect(resolveListControl(f({ itemType: 'percent', typeName: 'Double' }))).toBe('percent');
    expect(resolveListControl(f({ itemType: 'money', typeName: 'Decimal' }))).toBe('money');
    expect(resolveListControl(f({ itemType: 'decimal(10,3)', typeName: 'Decimal' }))).toBe('decimal');
    expect(resolveListControl(f({ itemType: 'file-zip' }))).toBe('file');
  });

  it('搜索控件：数值类走范围、压缩包走存在性', () => {
    expect(resolveSearchControl(f({ itemType: 'percent', typeName: 'Double' }))).toBe('numberRange');
    expect(resolveSearchControl(f({ itemType: 'money', typeName: 'Decimal' }))).toBe('numberRange');
    expect(resolveSearchControl(f({ itemType: 'file-zip' }))).toBe('fileExists');
  });
});

describe('resolveControl 表单控件映射', () => {
  it('ItemType 优先于 TypeName', () => {
    expect(resolveControl(f({ itemType: 'json', typeName: 'String' }))).toBe('json');
    expect(resolveControl(f({ itemType: 'image' }))).toBe('image');
    expect(resolveControl(f({ itemType: 'mail' }))).toBe('email');
    expect(resolveControl(f({ itemType: 'mobile' }))).toBe('tel');
    expect(resolveControl(f({ itemType: 'color' }))).toBe('color');
    expect(resolveControl(f({ itemType: 'html' }))).toBe('richHtml');
    expect(resolveControl(f({ itemType: 'markdown' }))).toBe('richMarkdown');
    expect(resolveControl(f({ itemType: 'textarea', typeName: 'String' }))).toBe('textarea');
  });

  it('Guid → readonly', () => {
    expect(resolveControl(f({ typeName: 'Guid' }))).toBe('readonly');
  });

  it('lovCode → lov / lovMulti', () => {
    expect(resolveControl(f({ typeName: 'Int32', lovCode: 'Enum.Kind' }))).toBe('lov');
    expect(resolveControl(f({ typeName: 'String', lovCode: 'Enum.Tags', multiple: true }))).toBe('lovMulti');
  });

  it('CLR 类型映射', () => {
    expect(resolveControl(f({ typeName: 'Boolean' }))).toBe('switch');
    expect(resolveControl(f({ typeName: 'DateTime' }))).toBe('datePicker');
    expect(resolveControl(f({ typeName: 'TimeSpan' }))).toBe('timePicker');
    expect(resolveControl(f({ typeName: 'Int32' }))).toBe('inputNumber');
    expect(resolveControl(f({ typeName: 'Decimal' }))).toBe('inputNumber');
    expect(resolveControl(f({ typeName: 'Enum' }))).toBe('lov');
  });

  it('大文本 → textarea，普通 → input', () => {
    expect(resolveControl(f({ typeName: 'String', length: 300 }))).toBe('textarea');
    expect(resolveControl(f({ typeName: 'String', length: 50 }))).toBe('input');
  });

  it('省市区级联（itemType=area1~4）→ areaCascader', () => {
    expect(resolveControl(f({ typeName: 'Int32', itemType: 'area1' }))).toBe('areaCascader');
    expect(resolveControl(f({ typeName: 'Int32', itemType: 'area2' }))).toBe('areaCascader');
    expect(resolveControl(f({ typeName: 'Int32', itemType: 'area3' }))).toBe('areaCascader');
    expect(resolveControl(f({ typeName: 'Int32', itemType: 'area4' }))).toBe('areaCascader');
  });
});

describe('resolveSearchControl 搜索控件映射', () => {
  it('范围类控件', () => {
    expect(resolveSearchControl(f({ typeName: 'Int32' }))).toBe('numberRange');
    expect(resolveSearchControl(f({ typeName: 'DateTime' }))).toBe('datetimeRange');
    expect(resolveSearchControl(f({ typeName: 'TimeSpan' }))).toBe('timeRange');
  });

  it('LOV / 开关 / 附件存在性', () => {
    expect(resolveSearchControl(f({ typeName: 'Int32', lovCode: 'Enum.Kind' }))).toBe('lov');
    expect(resolveSearchControl(f({ typeName: 'String', lovCode: 'Enum.T', multiple: true }))).toBe('lovMulti');
    expect(resolveSearchControl(f({ typeName: 'Boolean' }))).toBe('switch');
    expect(resolveSearchControl(f({ itemType: 'file' }))).toBe('fileExists');
  });

  it('默认文本', () => {
    expect(resolveSearchControl(f({ typeName: 'String' }))).toBe('text');
  });

  it('dataSource 数据字典 → 下拉（性别 SexKinds 单选）', () => {
    expect(
      resolveSearchControl(f({ name: 'Sex', typeName: 'SexKinds', dataSource: { '0': '未知', '1': '男', '2': '女' } })),
    ).toBe('lov');
  });

  it('dataSource + multiple → 多选下拉（部门 DepartmentID）', () => {
    expect(
      resolveSearchControl(
        f({ name: 'DepartmentID', typeName: 'Int32', dataSource: { '1': '研发部', '2': '运营部' }, multiple: true }),
      ),
    ).toBe('lovMulti');
  });

  it('lovCode + multiple → 多选下拉（角色 RoleID）', () => {
    expect(resolveSearchControl(f({ name: 'RoleID', typeName: 'Int32', lovCode: 'Role', multiple: true }))).toBe(
      'lovMulti',
    );
  });

  it('枚举类型名（非基元）无 dataSource 兜底 → 下拉', () => {
    expect(resolveSearchControl(f({ name: 'Kind', typeName: 'SomeEnum' }))).toBe('lov');
  });

  it('无选项的 Int32 仍是数字范围（部门未配置数据源时兜底）', () => {
    expect(resolveSearchControl(f({ name: 'DepartmentID', typeName: 'Int32' }))).toBe('numberRange');
  });

  it('省市区级联（itemType=area1~4）→ areaCascader', () => {
    expect(resolveSearchControl(f({ name: 'AreaId', typeName: 'Int32', itemType: 'area3' }))).toBe('areaCascader');
    expect(resolveSearchControl(f({ name: 'AreaId', typeName: 'Int32', itemType: 'area4' }))).toBe('areaCascader');
    expect(resolveSearchControl(f({ name: 'AreaId', typeName: 'Int32', itemType: 'area2' }))).toBe('areaCascader');
    expect(resolveSearchControl(f({ name: 'AreaId', typeName: 'Int32', itemType: 'area1' }))).toBe('areaCascader');
  });

  it('resolveAreaMaxLevel 按 itemType 后缀推导，默认 3 级', () => {
    expect(resolveAreaMaxLevel(f({ itemType: 'area1' }))).toBe(1);
    expect(resolveAreaMaxLevel(f({ itemType: 'area2' }))).toBe(2);
    expect(resolveAreaMaxLevel(f({ itemType: 'area3' }))).toBe(3);
    expect(resolveAreaMaxLevel(f({ itemType: 'area4' }))).toBe(4);
    expect(resolveAreaMaxLevel(f({ typeName: 'Int32' }))).toBe(3);
    expect(resolveAreaMaxLevel(f({ itemType: 'Area3' }))).toBe(3);
  });
});

describe('resolveListControl 列表单元格映射', () => {
  it('类型映射', () => {
    expect(resolveListControl(f({ typeName: 'Boolean' }))).toBe('boolean');
    expect(resolveListControl(f({ typeName: 'DateTime' }))).toBe('date');
    expect(resolveListControl(f({ typeName: 'Int32' }))).toBe('number');
    expect(resolveListControl(f({ typeName: 'String', lovCode: 'Enum.K' }))).toBe('lov');
    expect(resolveListControl(f({ itemType: 'image' }))).toBe('image');
    expect(resolveListControl(f({ itemType: 'color' }))).toBe('color');
    expect(resolveListControl(f({ typeName: 'Guid' }))).toBe('readonly');
  });
});

describe('widgetToControl @newlifex widget → 皮肤控件', () => {
  it('全量映射不丢', () => {
    expect(widgetToControl('text')).toBe('input');
    expect(widgetToControl('textarea')).toBe('textarea');
    expect(widgetToControl('number')).toBe('inputNumber');
    expect(widgetToControl('switch')).toBe('switch');
    expect(widgetToControl('date')).toBe('date');
    expect(widgetToControl('datetime')).toBe('datePicker');
    expect(widgetToControl('lov')).toBe('lov');
    expect(widgetToControl('lovMulti')).toBe('lovMulti');
    expect(widgetToControl('image')).toBe('image');
    expect(widgetToControl('file')).toBe('upload');
    expect(widgetToControl('json')).toBe('json');
    expect(widgetToControl('html')).toBe('richHtml');
    expect(widgetToControl('markdown')).toBe('richMarkdown');
    expect(widgetToControl('color')).toBe('color');
    expect(widgetToControl('icon')).toBe('icon');
  });
});

describe('serializeSubmitModel 提交序列化', () => {
  it('多选数组 → 逗号分隔字符串', () => {
    const fields = [
      { name: 'Tags', multiple: true, typeName: 'String' },
      { name: 'Name', typeName: 'String' },
    ] as FieldMeta[];
    const out = serializeSubmitModel({ Tags: ['a', 'b', 'c'], Name: 'x' }, fields);
    expect(out).toEqual({ Tags: 'a,b,c', Name: 'x' });
  });

  it('itemType multipleSelect 同样合并', () => {
    const fields = [{ name: 'Tags', itemType: 'multipleSelect', typeName: 'String' }] as FieldMeta[];
    const out = serializeSubmitModel({ Tags: ['1', '2'] }, fields);
    expect(out.Tags).toBe('1,2');
  });

  it('非数组原样透传', () => {
    const fields = [{ name: 'Tags', multiple: true, typeName: 'String' }] as FieldMeta[];
    const out = serializeSubmitModel({ Tags: 'a', Num: 3 }, fields);
    expect(out).toEqual({ Tags: 'a', Num: 3 });
  });

  it('表单键与字段名大小写不一致时仍合并多选（大小写不敏感）', () => {
    const fields = [{ name: 'RoleIds', multiple: true, typeName: 'String' }] as FieldMeta[];
    const out = serializeSubmitModel({ roleIds: ['1', '2'] }, fields);
    expect(out).toEqual({ roleIds: '1,2' });
  });
});

describe('mapDataToFormValues 编辑回填映射', () => {
  it('camelCase 数据 → PascalCase 字段名（大小写不敏感）', () => {
    const fields = [
      { name: 'ID', primaryKey: true, typeName: 'Int32' },
      { name: 'Name', typeName: 'String' },
      { name: 'DisplayName', typeName: 'String' },
    ] as FieldMeta[];
    const out = mapDataToFormValues({ id: 2, name: 'Stone', displayName: '石头' }, fields);
    expect(out).toEqual({ ID: 2, Name: 'Stone', DisplayName: '石头' });
  });

  it('布尔串转布尔（Enable 等）', () => {
    const fields = [{ name: 'Enable', typeName: 'Boolean' }] as FieldMeta[];
    expect(mapDataToFormValues({ enable: 'true' }, fields)).toEqual({ Enable: true });
    expect(mapDataToFormValues({ enable: 'false' }, fields)).toEqual({ Enable: false });
    expect(mapDataToFormValues({ enable: true }, fields)).toEqual({ Enable: true });
  });

  it('多选逗号串 → string[]（RoleIds 等）', () => {
    const fields = [{ name: 'RoleIds', multiple: true, typeName: 'String' }] as FieldMeta[];
    expect(mapDataToFormValues({ roleIds: '1,2,3' }, fields)).toEqual({ RoleIds: ['1', '2', '3'] });
  });

  it('多选 JSON 字符串 / 数组 同样归一', () => {
    const fields = [{ name: 'RoleIds', multiple: true, typeName: 'String' }] as FieldMeta[];
    expect(mapDataToFormValues({ roleIds: '["1","2"]' }, fields)).toEqual({ RoleIds: ['1', '2'] });
    expect(mapDataToFormValues({ roleIds: ['1', 2] }, fields)).toEqual({ RoleIds: ['1', '2'] });
  });

  it('itemType=multipleSelect 同样转数组', () => {
    const fields = [{ name: 'Tags', itemType: 'multipleSelect', typeName: 'String' }] as FieldMeta[];
    expect(mapDataToFormValues({ tags: 'a,b' }, fields)).toEqual({ Tags: ['a', 'b'] });
  });

  it('缺失字段跳过，不输出空 key', () => {
    const fields = [
      { name: 'Name', typeName: 'String' },
      { name: 'Mail', typeName: 'String' },
    ] as FieldMeta[];
    expect(mapDataToFormValues({ name: 'Stone' }, fields)).toEqual({ Name: 'Stone' });
  });
});

describe('resolveNumberPrecision / isFullWidthControl', () => {
  it('精度规则', () => {
    expect(resolveNumberPrecision(f({ typeName: 'Decimal', scale: 2 }))).toBe(2);
    expect(resolveNumberPrecision(f({ typeName: 'Decimal' }))).toBe(2);
    expect(resolveNumberPrecision(f({ typeName: 'Double' }))).toBe(8);
    expect(resolveNumberPrecision(f({ typeName: 'Single' }))).toBe(4);
    expect(resolveNumberPrecision(f({ typeName: 'Int32' }))).toBeUndefined();
  });

  it('全宽控件', () => {
    expect(isFullWidthControl('textarea')).toBe(true);
    expect(isFullWidthControl('json')).toBe(true);
    expect(isFullWidthControl('input')).toBe(false);
  });
});

describe('resolveDescription 描述裁剪', () => {
  it('裁掉 displayName 前缀与首部标点', () => {
    expect(resolveDescription(f({ displayName: '名称', description: '名称。实体名称' }))).toBe('实体名称');
    expect(resolveDescription(f({ displayName: '短文本', description: '短文本。必填的短文本示例' }))).toBe('必填的短文本示例');
  });

  it('与 displayName 相同 → 空串（不展示）', () => {
    expect(resolveDescription(f({ displayName: '名称', description: '名称' }))).toBe('');
  });

  it('无描述 → 空串', () => {
    expect(resolveDescription(f({ displayName: '名称' }))).toBe('');
    expect(resolveDescription(f({ description: '   ' }))).toBe('');
  });

  it('不以 displayName 开头 → 原样保留（仅去首部标点）', () => {
    expect(resolveDescription(f({ displayName: '名称', description: 'RPC服务端口。默认1882' }))).toBe('RPC服务端口。默认1882');
    expect(resolveDescription(f({ displayName: '名称', description: '。前缀标点' }))).toBe('前缀标点');
  });
});

describe('hasCategory 是否需分组', () => {
  it('全部无分类 → false（平铺）', () => {
    expect(hasCategory([f({ name: 'A' }), f({ name: 'B' })])).toBe(false);
  });

  it('任一字段有分类 → true（分组）', () => {
    expect(hasCategory([f({ name: 'A' }), f({ name: 'B', category: '扩展' })])).toBe(true);
  });

  it('纯空白分类视为无分类', () => {
    expect(hasCategory([f({ name: 'A', category: '  ' })])).toBe(false);
  });
});

describe('groupByCategory 按分类分组', () => {
  it('全部无分类归入默认组', () => {
    const g = groupByCategory([f({ name: 'A' }), f({ name: 'B' })]);
    expect(g).toEqual([{ category: defaultCategory(), fields: [f({ name: 'A' }), f({ name: 'B' })] }]);
  });

  it('按分类分组并保序，无分类归入默认组', () => {
    const fields = [
      f({ name: 'Name', category: '基本信息' }),
      f({ name: 'Enable' }),
      f({ name: 'Secret', category: '扩展' }),
      f({ name: 'Remark', category: '基本信息' }),
    ];
    const g = groupByCategory(fields);
    expect(g.map((x) => x.category)).toEqual(['基本信息', defaultCategory(), '扩展']);
    expect(g[0].fields.map((x) => x.name)).toEqual(['Name', 'Remark']);
    expect(g[1].fields.map((x) => x.name)).toEqual(['Enable']);
    expect(g[2].fields.map((x) => x.name)).toEqual(['Secret']);
  });

  it('分类前后空白被修剪', () => {
    const g = groupByCategory([f({ name: 'A', category: ' 基本信息 ' }), f({ name: 'B', category: '基本信息' })]);
    expect(g).toHaveLength(1);
    expect(g[0].category).toBe('基本信息');
  });
});

describe('对齐 MVC：枚举类型名 / 纯日期 / dataSource 多选', () => {
  it('真实枚举类型名（SexKinds）→ lov，选项由后端 dataSource 下发', () => {
    expect(resolveControl(f({ name: 'Sex', typeName: 'SexKinds', dataSource: { '0': '未知', '1': '男', '2': '女' } }))).toBe('lov');
    // 后端未下发 dataSource 时仍按枚举渲染下拉（空选项兜底）
    expect(resolveControl(f({ name: 'Sex', typeName: 'SexKinds' }))).toBe('lov');
    expect(resolveListControl(f({ typeName: 'SexKinds', dataSource: { '1': '男' } }))).toBe('lov');
  });

  it('纯日期：itemType=date 或字段名以 Date/day 结尾 → date，其余 datePicker', () => {
    expect(resolveControl(f({ name: 'Birthday', typeName: 'DateTime' }))).toBe('date');
    expect(resolveControl(f({ name: 'LastLoginDay', typeName: 'DateTime' }))).toBe('date');
    expect(resolveControl(f({ name: 'T', typeName: 'DateTime', itemType: 'date' }))).toBe('date');
    expect(resolveControl(f({ name: 'CreateTime', typeName: 'DateTime' }))).toBe('datePicker');
    expect(isDateOnlyField(f({ name: 'Birthday', typeName: 'DateTime' }))).toBe(true);
    expect(isDateOnlyField(f({ name: 'CreateTime', typeName: 'DateTime' }))).toBe(false);
    expect(isDateOnlyField(f({ name: 'T', typeName: 'DateTime', itemType: 'date' }))).toBe(true);
  });

  it('dataSource + 字段名以 s 结尾 → lovMulti，其余单选 lov', () => {
    expect(resolveControl(f({ name: 'RoleIds', typeName: 'String', dataSource: { '2': '管理员', '3': '普通用户' } }))).toBe('lovMulti');
    expect(resolveControl(f({ name: 'Tags', typeName: 'String', dataSource: { '1': 'A' }, multiple: true }))).toBe('lovMulti');
    expect(resolveControl(f({ name: 'Role', typeName: 'Int32', dataSource: { '2': '管理员' } }))).toBe('lov');
  });

  it('widgetToControl date → date', () => {
    expect(widgetToControl('date')).toBe('date');
  });

  it('纯日期搜索 → dateRange，其余 datetimeRange', () => {
    expect(resolveSearchControl(f({ name: 'Birthday', typeName: 'DateTime' }))).toBe('dateRange');
    expect(resolveSearchControl(f({ name: 'CreateTime', typeName: 'DateTime' }))).toBe('datetimeRange');
  });
});

describe('mapUrlParamsToSearchValues URL 查询 → 搜索控件值', () => {
  it('时间范围 dtStart/dtEnd → CreateTime 数组', () => {
    const fields = [f({ name: 'CreateTime', typeName: 'DateTime' })];
    expect(mapUrlParamsToSearchValues({ dtStart: '2026-08-31', dtEnd: '2026-09-01' }, fields)).toEqual({
      CreateTime: ['2026-08-31', '2026-09-01'],
    });
  });

  it('布尔 success=false → Success false（大小写不敏感）', () => {
    const fields = [f({ name: 'Success', typeName: 'Boolean' })];
    expect(mapUrlParamsToSearchValues({ success: 'false' }, fields)).toEqual({ Success: false });
    expect(mapUrlParamsToSearchValues({ success: 'true' }, fields)).toEqual({ Success: true });
  });

  it('其余字段大小写不敏感匹配透传，lovMulti 逗号串转数组', () => {
    const fields = [
      f({ name: 'Category', typeName: 'String' }),
      f({ name: 'RoleIds', typeName: 'String', dataSource: { '2': '管理员' } }),
    ];
    expect(mapUrlParamsToSearchValues({ category: '访问', roleids: '2,3' }, fields)).toEqual({
      Category: '访问',
      RoleIds: ['2', '3'],
    });
  });

  it('无关参数忽略，无匹配返回空对象', () => {
    const fields = [f({ name: 'Name', typeName: 'String' })];
    expect(mapUrlParamsToSearchValues({ foo: 'bar' }, fields)).toEqual({});
    expect(mapUrlParamsToSearchValues({}, fields)).toEqual({});
  });

  it('区间查询项（kind=range）：dtStart/dtEnd 回显为 name 的 [start,end]', () => {
    const fields = [f({ name: 'dtStart', typeName: 'DateTime', kind: 'range', end: 'dtEnd', field: 'CreateTime' })];
    expect(mapUrlParamsToSearchValues({ dtStart: '2026-08-01', dtEnd: '2026-08-31' }, fields)).toEqual({
      dtStart: ['2026-08-01', '2026-08-31'],
    });
  });
});

describe('resolveFormLayout 表单分流（FORM-9）', () => {
  it('无分类或单分类 → 平铺', () => {
    expect(resolveFormLayout([f({ name: 'A' })]).mode).toBe('flat');
    expect(resolveFormLayout([f({ name: 'A', category: '基本' }), f({ name: 'B', category: '基本' })]).mode).toBe('flat');
  });

  it('分类 2~3 且字段 ≤24 → 分区区块', () => {
    const fields = [
      f({ name: 'A', category: '基本' }),
      f({ name: 'B', category: '扩展' }),
      f({ name: 'C' }),
    ];
    expect(resolveFormLayout(fields).mode).toBe('sections');
  });

  it('分类超过 3 → Tabs（字段多时区块过长）', () => {
    const fields = ['一', '二', '三', '四'].map((c, i) => f({ name: `F${i}`, category: c }));
    expect(resolveFormLayout(fields).mode).toBe('tabs');
  });

  it('字段超过 24 → Tabs', () => {
    const fields = Array.from({ length: 25 }, (_, i) =>
      f({ name: `F${i}`, category: i % 2 === 0 ? '单' : '双' }),
    );
    expect(resolveFormLayout(fields).mode).toBe('tabs');
  });

  it('preset 覆盖分组方式与列数', () => {
    const fields = [f({ name: 'A', category: '基本' }), f({ name: 'B', category: '扩展' }) ];
    expect(resolveFormLayout(fields, { groupBy: 'tabs', columns: 3 })).toEqual({ mode: 'tabs', columns: 3 });
    // category 别名等价于 sections
    expect(resolveFormLayout(fields, { groupBy: 'category' }).mode).toBe('sections');
    expect(resolveFormLayout(fields, { groupBy: 'flat' }).mode).toBe('flat');
    // 默认列数 2
    expect(resolveFormLayout(fields).columns).toBe(2);
  });
});

describe('findPresetPatch', () => {
  const patch = { Remark: { label: '备注X' } };

  it('按字段名大小写不敏感查找', () => {
    expect(findPresetPatch(patch, 'remark')?.label).toBe('备注X');
    expect(findPresetPatch(patch, 'Remark')?.label).toBe('备注X');
  });

  it('未命中或无补丁时返回 undefined', () => {
    expect(findPresetPatch(patch, 'Name')).toBeUndefined();
    expect(findPresetPatch(undefined, 'Remark')).toBeUndefined();
  });
});

describe('serializeSubmitModel 虚拟字段（FORM-10）', () => {
  it('virtual 字段不参与提交，其它字段与多选归一不变', () => {
    const fields = [
      f({ name: 'Name' }),
      f({ name: 'OrgRange', virtual: true }),
      f({ name: 'RoleIds', typeName: 'String', multiple: true }),
    ];
    const out = serializeSubmitModel({ Name: 'a', OrgRange: '1-9', RoleIds: ['1', '2'] }, fields);
    expect(out).toEqual({ Name: 'a', RoleIds: '1,2' });
    expect(out.OrgRange).toBeUndefined();
  });
});
