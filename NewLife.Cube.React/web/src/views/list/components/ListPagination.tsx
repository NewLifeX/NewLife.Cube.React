/**
 * 列表分页 + 统计行
 */
import { Pagination, Space } from 'antd';
import { t } from '@/i18n';

export interface ListPaginationProps {
  total: number;
  current: number;
  pageSize: number;
  statData?: Record<string, unknown> | null;
  onChange?: (page: number, pageSize: number) => void;
}

export default function ListPagination({ total, current, pageSize, statData, onChange }: ListPaginationProps) {
  return (
    <div className="cube-pagination-bar">
      <div className="cube-stat-list">
        {statData &&
          Object.entries(statData).map(([k, v]) => (
            <span key={k} className="cube-stat-chip">
              {k}: <strong>{String(v ?? '')}</strong>
            </span>
          ))}
      </div>
      <Pagination
        showSizeChanger
        showQuickJumper
        showTotal={(total) => t('共 {{count}} 条', { count: total })}
        total={total}
        current={current}
        pageSize={pageSize}
        pageSizeOptions={[10, 20, 50, 100]}
        onChange={onChange}
      />
    </div>
  );
}
