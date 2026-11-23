/**
 * 详情字段值格式化
 *
 * `DetailDialog` 与用户详情页的只读描述/Tab 表格共用，避免两处各写一套类型分支。
 */
import type { ReactNode } from 'react';
import { Tag } from 'antd';
import LovCell from '@/components/field/LovCell';
import { t } from '@/i18n';
import { resolveListControl } from '@/utils/fieldControl';
import {
  formatDateTimeWithPattern,
  formatTimeSpan,
  formatTimeStamp,
  isMinDate,
} from '@/utils/numberFormat';
import type { FieldMeta } from '@/types/field';

/** 格式化日期：dateOnly 输出 yyyy-MM-dd，否则到时分秒 */
export function formatDateTime(value: unknown, dateOnly = false): string {
  if (value === null || value === undefined || value === '') return '';
  // 后端 DateTime.MinValue 表示未填写，留空
  if (isMinDate(value)) return '';
  const s = String(value);
  const d = new Date(s.includes('T') ? s : s.replace(' ', 'T'));
  if (isNaN(d.getTime())) return '';

  const pad = (n: number) => String(n).padStart(2, '0');
  const base = `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
  return dateOnly ? base : `${base} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
}

/** 去 HTML 标签并截断 */
function plainText(value: unknown, maxLength: number): string {
  const text = String(value ?? '')
    .replace(/<[^>]+>/g, '')
    .replace(/\s+/g, ' ')
    .trim();
  return text.length > maxLength ? `${text.slice(0, maxLength)}…` : text;
}

/** 格式化选项 */
export interface FormatDetailOptions {
  /** HTML 字段是否只输出纯文本摘要（默认 false，按富文本渲染） */
  stripHtml?: boolean;
  /** 纯文本最大长度；超出截断并用 title 显示全文 */
  truncate?: number;
}

/**
 * 按字段元数据格式化详情值
 *
 * @param meta 字段元数据
 * @param value 原始值
 * @param options 格式化选项
 * @returns 可渲染节点
 */
export function formatDetailValue(
  meta: FieldMeta,
  value: unknown,
  options: FormatDetailOptions = {},
): ReactNode {
  if (value === null || value === undefined || value === '') return '-';

  const control = resolveListControl(meta);
  switch (control) {
    case 'boolean':
      return (
        <Tag color={value === true || value === 'true' || value === 1 ? 'success' : 'default'}>
          {value === true || value === 'true' || value === 1 ? t('是') : t('否')}
        </Tag>
      );
    case 'date': {
      const custom = /^time-(.+)$/i.exec((meta.itemType ?? '').trim());
      if (custom) return <span>{formatDateTimeWithPattern(value, custom[1])}</span>;
      const dateOnly = (meta.itemType || '').toLowerCase() === 'date';
      return <span>{formatDateTime(value, dateOnly)}</span>;
    }
    case 'time':
      return <span>{formatDateTime(value)}</span>;
    case 'timespan':
      return <span style={{ fontVariantNumeric: 'tabular-nums' }}>{formatTimeSpan(value, meta)}</span>;
    case 'timestamp':
      return <span>{formatTimeStamp(value, meta)}</span>;
    case 'lov':
      return <LovCell value={value} lovCode={meta.lovCode} dataSource={meta.dataSource} />;
    case 'image':
      return (
        <img
          src={String(value)}
          alt=""
          style={{ maxWidth: 120, maxHeight: 120, borderRadius: 8, objectFit: 'cover' }}
        />
      );
    case 'file':
      return (
        <a href={String(value)} target="_blank" rel="noreferrer">
          {t('查看文件')}
        </a>
      );
    case 'html': {
      if (options.stripHtml) {
        const text = plainText(value, options.truncate ?? 80);
        return (
          <span title={plainText(value, 4000)} style={{ wordBreak: 'break-all' }}>
            {text}
          </span>
        );
      }
      return <div dangerouslySetInnerHTML={{ __html: String(value) }} />;
    }
    case 'json':
      return <span style={{ fontFamily: 'monospace', fontSize: 12, wordBreak: 'break-all' }}>{String(value)}</span>;
    case 'color':
      return (
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
          <span
            style={{
              display: 'inline-block',
              width: 16,
              height: 16,
              borderRadius: 4,
              background: String(value),
              border: '1px solid var(--cube-border-soft)',
            }}
          />
          {String(value)}
        </span>
      );
    default: {
      const text = String(value);
      if (options.truncate && text.length > options.truncate) {
        return (
          <span title={text} style={{ wordBreak: 'break-all' }}>
            {text.slice(0, options.truncate)}…
          </span>
        );
      }
      return <span style={{ wordBreak: 'break-all' }}>{text}</span>;
    }
  }
}

export default { formatDateTime, formatDetailValue };
