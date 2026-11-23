/**
 * 列表分页（统计行由 TableContent 的表格底部合计行承担）
 */
import { Pagination } from 'antd';
import { t } from '@/i18n';

export interface ListPaginationProps {
  total: number;
  current: number;
  pageSize: number;
  onChange?: (page: number, pageSize: number) => void;
}

export default function ListPagination({ total, current, pageSize, onChange }: ListPaginationProps) {
  return (
    <div className="cube-pagination-bar">
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
