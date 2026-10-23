/**
 * 页面呈现配置 preset 单元测试（META-5）
 *
 * 契约：preset 是纯前端呈现补丁（meta → preset → 用户列偏好），
 * 只改呈现字段（header/textAlign/view/visible）与页面设置，不改字段类型与提交语义。
 */
import { afterEach, describe, expect, it, vi } from 'vitest';
import type { CubeApi, DataField } from '@newlifex/api-core';
import {
  applyFieldPreset,
  clearPagePresets,
  getPagePreset,
  PageLogic,
  registerPagePreset,
  type PagePreset,
} from '@newlifex/page-logic';

/** 构造字段 */
function f(name: string, extra: Partial<DataField> = {}): DataField {
  return { name, typeName: 'String', displayName: name, ...extra };
}

describe('applyFieldPreset', () => {
  const fields = [f('Id'), f('Name'), f('Remark')];

  it('无补丁时原样返回', () => {
    expect(applyFieldPreset(fields, null)).toBe(fields);
  });

  it('remove 按名称大小写不敏感移除', () => {
    expect(applyFieldPreset(fields, { remove: ['remark'] }).map((x) => x.name)).toEqual(['Id', 'Name']);
  });

  it('patch 写回 header/textAlign/view/visible（label/align/renderer/hidden）', () => {
    const out = applyFieldPreset(fields, {
      patch: {
        name: { label: '编号-自定义', align: 'right', renderer: 'orgPicker', hidden: true },
      },
    });
    const name = out.find((x) => x.name === 'Name')!;
    expect(name.header).toBe('编号-自定义');
    expect(name.textAlign).toBe('right');
    expect(name.view).toBe('orgPicker');
    expect(name.visible).toBe(false);
    // 未打补丁字段保持不变
    expect(out.find((x) => x.name === 'Remark')).toEqual(f('Remark'));
  });

  it('order 重排列，未列出的保持原序排后', () => {
    const out = applyFieldPreset(fields, { order: ['Remark', 'Id'] });
    expect(out.map((x) => x.name)).toEqual(['Remark', 'Id', 'Name']);
  });

  it('append 追加字段，同名跳过', () => {
    const out = applyFieldPreset(fields, { append: [f('Name'), f('Extra')] });
    expect(out.map((x) => x.name)).toEqual(['Id', 'Name', 'Remark', 'Extra']);
  });

  it('组合顺序：移除 → 补丁 → 排序 → 追加', () => {
    const out = applyFieldPreset(fields, {
      remove: ['Id'],
      patch: { Remark: { label: '备注X' } },
      order: ['Remark'],
      append: [f('Code')],
    });
    expect(out.map((x) => x.name)).toEqual(['Remark', 'Name', 'Code']);
    expect(out[0].header).toBe('备注X');
  });
});

describe('preset 注册表', () => {
  afterEach(() => clearPagePresets());

  it('按路径大小写不敏感注册与查找', () => {
    const preset: PagePreset = { list: { remove: ['Remark'] } };
    registerPagePreset('/Admin/User', preset);
    expect(getPagePreset('/Admin/User')).toBe(preset);
    expect(getPagePreset('/admin/user')).toBe(preset);
    expect(getPagePreset('/Admin/Role')).toBeNull();
  });

  it('同一路径后注册覆盖先注册', () => {
    registerPagePreset('/X', { list: { remove: ['A'] } });
    const next: PagePreset = { list: { remove: ['B'] } };
    registerPagePreset('/X', next);
    expect(getPagePreset('/X')).toBe(next);
  });
});

describe('PageLogic 应用 preset', () => {
  /** 构造假 API */
  function makeApi(): CubeApi {
    return {
      page: {
        getPage: vi.fn(async () => ({
          code: 0,
          data: {
            entity: { primaryKey: 'Id' },
            setting: { menuId: 1, enableAdd: true },
            list: [f('Id', { primaryKey: true }), f('Name'), f('Remark')],
            search: [],
            addForm: [f('Name')],
            editForm: [f('Name')],
            detail: [f('Name')],
          },
        })),
      },
    } as unknown as CubeApi;
  }

  it('列表补丁与设置覆盖生效，preset 进入状态', async () => {
    const preset: PagePreset = {
      setting: { enableAdd: false },
      list: { patch: { Name: { label: '姓名' } }, remove: ['Remark'] },
    };
    const logic = new PageLogic({ api: makeApi(), update: () => {}, preset, userPermission: '1#-1' });

    await logic.loadFields('/Demo');

    const state = logic.getState();
    expect(state.preset).toBe(preset);
    expect(state.pageSetting?.enableAdd).toBe(false);
    // preset 关闭了页面新增能力
    expect(state.canAdd).toBe(false);
    const names = state.listFields.map((x) => x.field.name);
    expect(names).toEqual(['Id', 'Name']);
    expect(state.listFields.find((x) => x.field.name === 'Name')?.field.header).toBe('姓名');
  });

  it('未显式传 preset 时按 type 查注册表', async () => {
    registerPagePreset('/Demo', { list: { remove: ['Name'] } });
    const logic = new PageLogic({ api: makeApi(), update: () => {}, userPermission: '1#-1' });

    await logic.loadFields('/Demo');

    expect(logic.getState().listFields.map((x) => x.field.name)).toEqual(['Id', 'Remark']);
  });
});
