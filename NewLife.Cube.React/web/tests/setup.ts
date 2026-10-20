import '@testing-library/jest-dom';
import { afterEach, vi } from 'vitest';
import { cleanup } from '@testing-library/react';

// 收尾：卸载组件并清掉 antd/rc 组件留下的延时器，避免定时器在测试环境销毁后触发
afterEach(() => {
  cleanup();
  vi.clearAllTimers();
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
