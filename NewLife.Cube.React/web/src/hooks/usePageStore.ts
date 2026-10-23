/**
 * 页面 Store Hook（@newlifex/page-logic/zustand）
 *
 * 按实体路径前缀（type）缓存 store hook，每个实体路径复用同一 store。
 */
import { createPageStore, type ZustandPageState } from '@newlifex/page-logic/zustand';
import type { StoreApi, UseBoundStore } from 'zustand';
import { api } from '@/api';
import { useUserStore } from '@/stores/user';

type PageStore = UseBoundStore<StoreApi<ZustandPageState>>;

const storeCache = new Map<string, PageStore>();

/**
 * 获取（或创建）指定实体路径的页面 Store
 *
 * @param type 实体路径前缀，如 '/Admin/User'、'/Cube/App'
 * @returns zustand store hook
 *
 * @example
 * ```tsx
 * const store = usePageStore(type);
 * const tableData = store((s) => s.tableData);
 * const loadData = store((s) => s.loadData);
 * ```
 */
export function usePageStore(type: string): PageStore {
  const key = type || '/';
  if (!storeCache.has(key)) {
    // 菜单权限用 getter 动态读取（菜单异步加载后生效）；
    // 同时传入用户权限串与系统管理员标志，供 page-logic 按 menuId + requiredPermissions 判定动作权限
    storeCache.set(
      key,
      createPageStore(
        api,
        type,
        20,
        () => useUserStore.getState().getMenuPermission(type),
        () => useUserStore.getState().userInfo?.permission,
        () => useUserStore.getState().userInfo?.isSystemAdmin === true,
      ),
    );
  }
  return storeCache.get(key)!;
}

export default usePageStore;
