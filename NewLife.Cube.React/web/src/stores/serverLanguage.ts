/**
 * 后端语言清单 Store
 *
 * 语言清单与强制语言只需在应用启动时拉取一次，供 App（强制语言跟随）与 LanguageSwitch 共用。
 */
import { create } from 'zustand';
import { fetchServerLanguages, type ServerLanguageInfo } from '@/i18n/serverLanguages';

interface ServerLanguageState {
  /** 后端语言清单；接口不可用时为 null，前端回退内置清单 */
  info: ServerLanguageInfo | null;
  /** 是否正在加载 */
  loading: boolean;
  /** 加载语言清单（已加载或加载中时跳过） */
  load: () => Promise<void>;
}

export const useServerLanguageStore = create<ServerLanguageState>((set, get) => ({
  info: null,
  loading: false,

  load: async () => {
    if (get().info || get().loading) return;

    set({ loading: true });
    try {
      const info = await fetchServerLanguages();
      set({ info });
    } finally {
      set({ loading: false });
    }
  },
}));

export default useServerLanguageStore;
