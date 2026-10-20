/**
 * 视图解析诊断页（/Cube/ViewTrace）
 *
 * 对齐 MVC ViewTraceController + Index.cshtml：输入 区域/控制器/视图/主题，
 * 展示理论候选路径（ViewLocationHelper 7 级优先级）、物理文件存在性、实际命中。
 * 后端 API 版无 Razor 视图引擎，命中按「最高优先级物理存在文件」模拟。
 */
import { useCallback, useEffect, useState } from 'react';
import { Alert, Button, Card, Form, Input, Table } from 'antd';
import { SearchOutlined } from '@ant-design/icons';
import { api } from '@/api';
import { t } from '@/i18n';

export interface ViewTracePageProps {
  /** 实体路径前缀，如 '/Cube/ViewTrace' */
  type: string;
}

/** 后端返回的诊断结果 */
export interface ViewTraceResult {
  area?: string;
  controller?: string;
  view?: string;
  theme?: string;
  candidates?: string[];
  physical?: boolean[];
  hit?: string | null;
  hitIndex?: number;
}

/** 默认表单值（对齐 MVC 请求默认 Index） */
export const DEFAULT_VALUES = { area: '', controller: '', view: 'Index', theme: '' };

/** 诊断结果 → 表格行（物理存在/命中标记），纯函数供单测 */
export function buildRows(result: ViewTraceResult | null) {
  const candidates = result?.candidates ?? [];
  const physical = result?.physical ?? [];
  const hit = result?.hit ?? null;
  return candidates.map((path, i) => ({
    key: i,
    priority: i + 1,
    path,
    physical: physical[i] ?? false,
    hit: hit != null && path === hit,
  }));
}

export default function ViewTracePage({ type }: ViewTracePageProps) {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ViewTraceResult | null>(null);

  /** 调用诊断接口 */
  const run = useCallback(
    async (values: Partial<ViewTraceResult>) => {
      setLoading(true);
      try {
        const res = await api.client.get(type, { params: { ...DEFAULT_VALUES, ...values } });
        setResult((res.data?.data ?? {}) as ViewTraceResult);
      } catch {
        setResult(null);
      } finally {
        setLoading(false);
      }
    },
    [type],
  );

  useEffect(() => {
    void run(DEFAULT_VALUES);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [type]);

  const rows = buildRows(result);
  const hit = result?.hit ?? null;

  return (
    <Card
      size="small"
      title={t('视图解析诊断')}
      extra={<small>{t('排查视图覆盖不生效')}</small>}
    >
      <Form
        form={form}
        layout="inline"
        initialValues={DEFAULT_VALUES}
        onFinish={(v) => void run(v)}
        style={{ marginBottom: 16 }}
      >
        <Form.Item name="area" label={t('区域')}>
          <Input placeholder="Admin" allowClear style={{ width: 140 }} />
        </Form.Item>
        <Form.Item name="controller" label={t('控制器')}>
          <Input placeholder="User" allowClear style={{ width: 140 }} />
        </Form.Item>
        <Form.Item name="view" label={t('视图')}>
          <Input placeholder="Index" allowClear style={{ width: 140 }} />
        </Form.Item>
        <Form.Item name="theme" label={t('主题')}>
          <Input placeholder="ACE" allowClear style={{ width: 120 }} />
        </Form.Item>
        <Form.Item>
          <Button type="primary" htmlType="submit" icon={<SearchOutlined />} loading={loading}>
            {t('解析')}
          </Button>
        </Form.Item>
      </Form>

      {result && (
        <>
          <h4 style={{ margin: '8px 0' }}>{t('① 理论候选路径（ViewLocationHelper，6 级优先级）')}</h4>
          <Table
            size="small"
            rowKey="key"
            dataSource={rows}
            pagination={false}
            locale={{ emptyText: t('暂无候选路径') }}
            columns={[
              { title: t('优先级'), dataIndex: 'priority', width: 70, align: 'center' },
              { title: t('候选路径'), dataIndex: 'path' },
              {
                title: t('物理文件'),
                dataIndex: 'physical',
                width: 100,
                align: 'center',
                render: (v: boolean) => (v ? t('✅ 存在') : '—'),
              },
              {
                title: t('实际命中'),
                dataIndex: 'hit',
                width: 100,
                align: 'center',
                render: (v: boolean) => (v ? t('⭐ 命中') : '—'),
              },
            ]}
            rowClassName={(r) => {
              const cls: string[] = [];
              if (r.physical) cls.push('vt-phy');
              if (r.hit) cls.push('vt-hit');
              return cls.join(' ');
            }}
          />

          <h4 style={{ margin: '16px 0 8px' }}>{t('② 视图解析结果')}</h4>
          {hit ? (
            <Alert type="success" showIcon message={t('命中：{{hit}}', { hit })} />
          ) : (
            <Alert type="error" showIcon message={t('未命中！以下候选路径均未找到物理文件。')} />
          )}

          <Alert
            type="info"
            style={{ marginTop: 12 }}
            message={t('提示：绿色行 = 物理文件存在（放对了位置）；橙色行 = 与命中一致。覆盖不生效时，先看 ① 中你的文件是否出现、是否被更高优先级遮蔽。')}
          />
        </>
      )}
    </Card>
  );
}
