import type { EChartsOption } from 'echarts';
import { useMemo } from 'react';

import { BaseEChart } from './BaseEChart';
import type { DimensionBreakdown } from '../../utils/aggregations';

interface DimensionBarChartProps {
  ariaLabel: string;
  data: DimensionBreakdown[];
}

export function DimensionBarChart({ ariaLabel, data }: DimensionBarChartProps) {
  const option = useMemo<EChartsOption>(
    () => ({
      color: ['#0f766e', '#64748b'],
      tooltip: {
        trigger: 'axis',
        axisPointer: {
          type: 'shadow'
        }
      },
      legend: {
        top: 0,
        right: 0,
        data: ['收入', '安装']
      },
      grid: {
        left: 52,
        right: 20,
        top: 42,
        bottom: 34
      },
      xAxis: {
        type: 'category',
        data: data.map((item) => item.label)
      },
      yAxis: [
        {
          type: 'value',
          name: '收入'
        },
        {
          type: 'value',
          name: '安装'
        }
      ],
      series: [
        {
          name: '收入',
          type: 'bar',
          barMaxWidth: 28,
          data: data.map((item) => item.revenueUsd)
        },
        {
          name: '安装',
          type: 'line',
          yAxisIndex: 1,
          data: data.map((item) => item.installs)
        }
      ]
    }),
    [data]
  );

  return <BaseEChart ariaLabel={ariaLabel} height={260} option={option} />;
}
