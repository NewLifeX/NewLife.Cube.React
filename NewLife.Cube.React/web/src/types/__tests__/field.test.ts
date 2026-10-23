/**
 * 字段元数据透传单元测试（META-1）
 *
 * 契约来源：`/meta` 字段属性（页面呈现架构 §4.2），
 * `toFieldMeta` 必须完整承接 api-core `DataField`，不得丢字段。
 */
import { describe, expect, it } from 'vitest';
import { toFieldMeta } from '../field';

describe('toFieldMeta 透传 /meta 扩展属性', () => {
  it('完整承接呈现与渲染器相关属性', () => {
    const meta = toFieldMeta({
      name: 'DetailLink',
      displayName: '明细',
      typeName: 'String',
      virtual: true,
      visible: false,
      header: '明细列',
      headerTitle: '点击查看明细',
      title: '提示 {Id}',
      url: '/School/StudentDetail?studentId={Id}',
      text: '查看',
      target: '_blank',
      dataAction: 'action',
      textAlign: 'right',
      maxWidth: 20,
      class: 'cube-cell-link',
      view: 'orgPicker',
      props: { group: ['FirstId', 'LastId'] },
      parentField: 'Section',
      valueField: 'DisplayName',
      lovCode: 'List.Cube.User',
      multiple: true,
    });

    expect(meta).toMatchObject({
      name: 'DetailLink',
      virtual: true,
      visible: false,
      header: '明细列',
      headerTitle: '点击查看明细',
      title: '提示 {Id}',
      text: '查看',
      target: '_blank',
      dataAction: 'action',
      textAlign: 'right',
      maxWidth: 20,
      class: 'cube-cell-link',
      view: 'orgPicker',
      parentField: 'Section',
      valueField: 'DisplayName',
      lovCode: 'List.Cube.User',
      multiple: true,
    });
    expect(meta.props).toEqual({ group: ['FirstId', 'LastId'] });
  });

  it('搜索区间项透传 kind/end/field', () => {
    const meta = toFieldMeta({
      name: 'dtStart',
      displayName: '创建时间',
      typeName: 'DateTime',
      kind: 'range',
      end: 'dtEnd',
      field: 'CreateTime',
    });

    expect(meta.kind).toBe('range');
    expect(meta.end).toBe('dtEnd');
    expect(meta.field).toBe('CreateTime');
  });

  it('缺省属性不产生额外值（保持 undefined，不误判为 false）', () => {
    const meta = toFieldMeta({ name: 'Name', typeName: 'String' });

    expect(meta.visible).toBeUndefined();
    expect(meta.virtual).toBeUndefined();
    expect(meta.kind).toBeUndefined();
  });
});
