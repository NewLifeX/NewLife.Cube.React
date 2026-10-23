/**
 * 文案键完整性守卫
 *
 * 约定：`fullyTranslatedLanguages` 中的语言必须覆盖源码里所有 `t('...')` 业务文案键。
 * 新增界面文案后，若未同步词典，本测试会失败并列出缺失键。
 */
import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { fullyTranslatedLanguages } from '../index';
import appZhCN from '../app/zh-CN';
import appZhTW from '../app/zh-TW';
import appEnUS from '../app/en-US';
import appEs from '../app/es';
import appDe from '../app/de';
import appJa from '../app/ja';
import appFr from '../app/fr';
import appPt from '../app/pt';
import appRu from '../app/ru';
import appKo from '../app/ko';
import appAr from '../app/ar';

const dicts: Record<string, Record<string, string>> = {
  'zh-CN': appZhCN,
  'zh-TW': appZhTW,
  'en-US': appEnUS,
  'es-ES': appEs,
  'de-DE': appDe,
  'ja-JP': appJa,
  'fr-FR': appFr,
  'pt-BR': appPt,
  'ru-RU': appRu,
  'ko-KR': appKo,
  'ar-SA': appAr,
};

/** 递归收集源码文件 */
function walk(dir: string): string[] {
  const files: string[] = [];
  for (const name of fs.readdirSync(dir)) {
    const full = path.join(dir, name);
    const stat = fs.statSync(full);
    if (stat.isDirectory()) {
      if (name === '__tests__' || name === 'node_modules' || name === 'i18n') continue;
      files.push(...walk(full));
    } else if (/\.(ts|tsx)$/.test(name)) {
      files.push(full);
    }
  }
  return files;
}

/** 收集源码中所有 t('...') 静态文案键 */
function collectUsedKeys(): Set<string> {
  const keys = new Set<string>();
  for (const file of walk(path.resolve(process.cwd(), 'src'))) {
    const source = fs.readFileSync(file, 'utf8');
    for (const match of source.matchAll(/\bt\(\s*['"`]([^'"`]+)['"`]/g)) {
      const key = match[1];
      if (key && !key.includes('${')) keys.add(key);
    }
  }
  return keys;
}

describe('i18n 文案键完整性', () => {
  it('至少 11 种语言完成全量翻译', () => {
    expect(fullyTranslatedLanguages).toHaveLength(11);
    expect(Object.keys(dicts)).toHaveLength(11);
  });

  it('11 种语言词典键集合一致且无空值', () => {
    const baseKeys = Object.keys(appZhCN).sort();
    expect(baseKeys.length).toBeGreaterThan(500);

    for (const [language, dict] of Object.entries(dicts)) {
      expect(Object.keys(dict).sort(), language).toEqual(baseKeys);
      for (const key of baseKeys) {
        expect(dict[key], `${language} 缺少 [${key}]`).toBeTruthy();
      }
    }
  });

  it('app 目录只保留 11 种全量语言词典', () => {
    const dir = path.resolve(process.cwd(), 'src/i18n/app');
    const files = fs
      .readdirSync(dir)
      .filter((name) => name.endsWith('.ts'))
      .sort();

    expect(files).toEqual(
      ['ar', 'de', 'en-US', 'es', 'fr', 'ja', 'ko', 'pt', 'ru', 'zh-CN', 'zh-TW']
        .map((name) => `${name}.ts`)
        .sort(),
    );
  });

  it('源码中所有 t() 文案键在 11 种语言中均有译文', () => {
    const used = [...collectUsedKeys()].filter((key) => !key.startsWith('common.') && !key.startsWith('login.'));
    expect(used.length).toBeGreaterThan(400);

    for (const [language, dict] of Object.entries(dicts)) {
      const missing = used.filter((key) => !dict[key]);
      expect(missing, `${language} 缺少文案键: ${missing.join(' | ')}`).toEqual([]);
    }
  });
});
