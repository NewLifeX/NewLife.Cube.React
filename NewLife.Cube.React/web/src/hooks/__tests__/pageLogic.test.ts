/**
 * PageLogic 元数据装配与动作权限单元测试（META-2 / META-3）
 *
 * 契约来源：`/meta` 视图自描述（entity/setting/list/form/add/detail/search/toolbar/ui），
 * 动作权限按 `setting.menuId` + `setting.requiredPermissions` 与用户权限串位测试，
 * 系统管理员直通；meta 未下发 menuId 时回退菜单树权限映射。
 */
import { describe, expect, it, vi } from 'vitest';
import type { CubeApi } from '@newlifex/api-core';
import { PageLogic } from '@newlifex/page-logic';

/** 构造已由 api-core 展开的页面元数据（addForm/editForm/detail 为消费结构） */
function makeMeta(overrides: Record<string, unknown> = {}) {
  return {
    code: 0,
    data: {
      entity: { name: 'Demo', displayName: '演示', primaryKey: 'ID' },
      setting: {
        enableAdd: true,
        menuId: 12,
        requiredPermissions: { add: 2, update: 4, delete: 8 },
      },
      list: [{ name: 'Name', displayName: '名称', typeName: 'String', primaryKey: true }],
      search: [],
      addForm: [{ name: 'Name', displayName: '名称', typeName: 'String' }],
      editForm: [{ name: 'Name', displayName: '名称', typeName: 'String' }],
      detail: [{ name: 'Name', displayName: '名称', typeName: 'String' }],
      toolbar: [{ name: 'Refresh', displayName: '批量刷新', kind: 'request', action: 'Refresh', include: ['keys'] }],
      ui: { density: 'compact' },
      ...overrides,
    },
  };
}

/** 构造只实现 getPage 的假 API */
function makeApi(response: unknown): CubeApi {
  return { page: { getPage: vi.fn(async () => response) } } as unknown as CubeApi;
}

describe('PageLogic.loadFields 元数据装配', () => {
  it('主键优先取 entity.primaryKey，toolbar/ui 进入状态', async () => {
    const logic = new PageLogic({ api: makeApi(makeMeta()), update: () => {} });

    await logic.loadFields('/Demo/Test');

    const state = logic.getState();
    expect(state.pkField).toBe('ID');
    expect(state.entity?.displayName).toBe('演示');
    expect(state.toolbar).toHaveLength(1);
    expect(state.toolbar[0].kind).toBe('request');
    expect(state.ui.density).toBe('compact');
  });

  it('列表无主键字段时仍能用 entity.primaryKey 定位主键', async () => {
    const logic = new PageLogic({
      api: makeApi(makeMeta({ list: [{ name: 'Name', displayName: '名称', typeName: 'String' }] })),
      update: () => {},
    });

    await logic.loadFields('/Demo/Test');

    expect(logic.getState().pkField).toBe('ID');
  });
});

describe('PageLogic 动作权限（menuId + requiredPermissions）', () => {
  it('按用户权限串位测试：仅新增位时能新增不能改删', async () => {
    const logic = new PageLogic({
      api: makeApi(makeMeta()),
      update: () => {},
      userPermission: '12#2',
    });

    await logic.loadFields('/Demo/Test');

    const state = logic.getState();
    expect(state.canAdd).toBe(true);
    expect(state.canEdit).toBe(false);
    expect(state.canDelete).toBe(false);
  });

  it('All(-1) 权限可新增修改删除', async () => {
    const logic = new PageLogic({
      api: makeApi(makeMeta()),
      update: () => {},
      userPermission: '12#-1',
    });

    await logic.loadFields('/Demo/Test');

    const state = logic.getState();
    expect(state.canAdd).toBe(true);
    expect(state.canEdit).toBe(true);
    expect(state.canDelete).toBe(true);
  });

  it('系统管理员直通', async () => {
    const logic = new PageLogic({
      api: makeApi(makeMeta()),
      update: () => {},
      userPermission: '',
      isSystemAdmin: true,
    });

    await logic.loadFields('/Demo/Test');

    const state = logic.getState();
    expect(state.canAdd).toBe(true);
    expect(state.canEdit).toBe(true);
    expect(state.canDelete).toBe(true);
    expect(state.canExport).toBe(true);
  });

  it('页面能力优先：enableAdd=false 或只读页即使有权限也不可新增', async () => {
    const logic = new PageLogic({
      api: makeApi(
        makeMeta({
          setting: {
            enableAdd: false,
            isReadOnly: true,
            menuId: 12,
            requiredPermissions: { add: 2, update: 4, delete: 8 },
          },
        }),
      ),
      update: () => {},
      userPermission: '12#-1',
    });

    await logic.loadFields('/Demo/Test');

    const state = logic.getState();
    expect(state.canAdd).toBe(false);
    expect(state.canEdit).toBe(false);
    expect(state.canDelete).toBe(false);
  });

  it('meta 未下发 menuId 时回退菜单权限映射（旧口径）', async () => {
    const logic = new PageLogic({
      api: makeApi(
        makeMeta({
          setting: { enableAdd: true },
        }),
      ),
      update: () => {},
      menuPermissions: { Add: '新增' },
    });

    await logic.loadFields('/Demo/Test');

    const state = logic.getState();
    expect(state.canAdd).toBe(true);
    expect(state.canEdit).toBe(false);
    expect(state.canDelete).toBe(false);
  });
});
