/**
 * 多语言包体积守卫
 *
 * 11 种全量语言静态打包是当前决策（见 Doc/架构设计.md §4.8）：
 * 实测约 335 KB 原始 / 77 KB gzip，占前端总包约 4.8%。
 * 本测试防止词典异常膨胀；超过预算时应先评估，再决定是否切换按语言懒加载。
 */
import { gzipSync } from 'node:zlib';
import { describe, expect, it } from 'vitest';
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
import shellZhCN from '../zh-CN';
import shellZhTW from '../zh-TW';
import shellEnUS from '../en-US';
import shellEs from '../es';
import shellDe from '../de';
import shellJa from '../ja';
import shellFr from '../fr';
import shellPt from '../pt';
import shellRu from '../ru';
import shellKo from '../ko';
import shellAr from '../ar';

const appDicts = {
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

const shellDicts = {
  'zh-CN': shellZhCN,
  'zh-TW': shellZhTW,
  'en-US': shellEnUS,
  'es-ES': shellEs,
  'de-DE': shellDe,
  'ja-JP': shellJa,
  'fr-FR': shellFr,
  'pt-BR': shellPt,
  'ru-RU': shellRu,
  'ko-KR': shellKo,
  'ar-SA': shellAr,
};

describe('i18n 语言包体积', () => {
  it('11 种全量语言合计不超过 100 KB gzip / 400 KB 原始', () => {
    for (const [language, dict] of Object.entries(appDicts)) {
      const size = Buffer.byteLength(JSON.stringify(dict), 'utf8');
      console.log(`${language}: ${(size / 1024).toFixed(1)} KB raw`);
    }

    const payload = JSON.stringify({ app: appDicts, shell: shellDicts });
    const raw = Buffer.byteLength(payload, 'utf8');
    const gzip = gzipSync(Buffer.from(payload, 'utf8'), { level: 9 }).length;
    console.log(`合计: ${(raw / 1024).toFixed(1)} KB raw / ${(gzip / 1024).toFixed(1)} KB gzip`);

    expect(gzip).toBeLessThanOrEqual(100 * 1024);
    expect(raw).toBeLessThanOrEqual(400 * 1024);
  });
});
