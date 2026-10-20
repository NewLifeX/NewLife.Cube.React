/**
 * 图表视图（表格/图表视图切换的图表侧，规范 §7.6）
 *
 * GetChartData 返回 ECharts 配置数组（option 对象），逐个渲染；
 * 独立成视图不占表格空间，自适应容器宽度，窗口缩放时自动重绘。
 *
 * 布局：第一个图表（通常为主图，信息量最大）占满整行，其余图表两列并排，
 * 避免多图表纵向堆叠时视觉拥挤、主图不突出。
 */
import { useEffect, useRef } from 'react';
import { Empty, Spin } from 'antd';
import * as echarts from 'echarts';
import { t } from '@/i18n';

export interface ChartViewProps {
  /** ECharts 配置数组 */
  charts: unknown[];
}

export default function ChartView({ charts }: ChartViewProps) {
  if (!charts.length) return <Empty description={t('暂无图表数据')} />;

  return (
    <div className="cube-chart-view">
      {charts.map((option, i) => (
        <ChartPanel key={i} option={option} full={i === 0} />
      ))}
    </div>
  );
}

function ChartPanel({ option, full }: { option: unknown; full?: boolean }) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!ref.current || !option || typeof option !== 'object') return;
    const chart = echarts.init(ref.current);
    chart.setOption(option as echarts.EChartsOption);
    const resize = () => chart.resize();
    window.addEventListener('resize', resize);
    return () => {
      window.removeEventListener('resize', resize);
      chart.dispose();
    };
  }, [option]);

  return (
    <div className={`cube-chart-panel${full ? ' cube-chart-panel-full' : ''}`}>
      <Spin spinning={!option}>
        <div ref={ref} style={{ width: '100%', height: 360 }} />
      </Spin>
    </div>
  );
}
