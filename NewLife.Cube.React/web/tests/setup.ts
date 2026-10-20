import '@testing-library/jest-dom';
import { afterEach, vi } from 'vitest';
import { cleanup } from '@testing-library/react';

// 跟踪组件排下的延时器：真实计时器下 vi.clearAllTimers 无效，
// antd/rc 组件的延时回调若在测试环境销毁后触发会被报成未捕获异常。
const pendingTimers = new Set<ReturnType<typeof setTimeout>>();
if (typeof window !== 'undefined' && !(window as unknown as Record<string, boolean>).__cubeTimerPatched) {
  (window as unknown as Record<string, boolean>).__cubeTimerPatched = true;
  const rawSetTimeout = window.setTimeout.bind(window);
  window.setTimeout = ((handler: TimerHandler, timeout?: number, ...args: unknown[]) => {
    const id = rawSetTimeout(handler as () => void, timeout, ...args);
    pendingTimers.add(id);
    return id;
  }) as typeof window.setTimeout;
}

// 收尾：卸载组件并清掉所有延时器，避免定时器在测试环境销毁后触发
afterEach(() => {
  cleanup();
  for (const id of pendingTimers) clearTimeout(id);
  pendingTimers.clear();
  vi.useRealTimers();
});

// ── 语言固定为简体中文 ────────────────────────────────────────────
// 界面文案以中文原文为键（见 src/i18n），测试断言依赖中文；setup 先于测试模块加载，
// 因此这里写入的 localStorage 会被 i18n 初始化读取。
if (typeof localStorage !== 'undefined') localStorage.setItem('cube-language', 'zh-CN');

// ── antd v5 在 jsdom 环境下需要的全局 mock ─────────────────────────
// matchMedia：antd Grid/响应式组件在 jsdom 缺失时抛错
if (typeof window !== 'undefined' && !window.matchMedia) {
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: (query: string) => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: () => {},
      removeListener: () => {},
      addEventListener: () => {},
      removeEventListener: () => {},
      dispatchEvent: () => false,
    }),
  });
}

// ResizeObserver：antd 部分组件（如 Select 下拉）依赖
if (typeof window !== 'undefined' && !window.ResizeObserver) {
  class ResizeObserverMock {
    observe() {}
    unobserve() {}
    disconnect() {}
  }
  (window as unknown as Record<string, unknown>).ResizeObserver = ResizeObserverMock;
}

// getComputedStyle：jsdom 对伪元素参数抛 “Not implemented”，丢弃该参数交给 antd
if (typeof window !== 'undefined' && window.getComputedStyle) {
  const original = window.getComputedStyle.bind(window);
  window.getComputedStyle = (elt: Element) => original(elt);
}

// 未 mock 的 XHR 请求在环境销毁后仍会回调，jsdom 会把它报成未捕获异常并让整个测试进程退出码为 1。
// 这里让所有真实 XHR 直接返回空 200，组件走各自的错误分支，不再产生跨环境的网络错误。
if (typeof XMLHttpRequest !== 'undefined') {
  XMLHttpRequest.prototype.send = function () {
    const self = this as XMLHttpRequest & { _cubeStubbed?: boolean };
    self._cubeStubbed = true;
    setTimeout(() => {
      Object.defineProperty(self, 'readyState', { value: 4, configurable: true });
      Object.defineProperty(self, 'status', { value: 200, configurable: true });
      Object.defineProperty(self, 'responseText', { value: '', configurable: true });
      self.dispatchEvent(new Event('readystatechange'));
      self.dispatchEvent(new Event('load'));
      self.dispatchEvent(new Event('loadend'));
    }, 0);
  };
}
