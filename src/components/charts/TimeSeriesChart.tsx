import type { EChartsOption } from 'echarts';
import { useMemo } from 'react';

import { BaseEChart } from './BaseEChart';
import type { DashboardTrendPoint } from '../../utils/aggregations';

interface TimeSeriesChartProps {
  data: DashboardTrendPoint[];
}

export function TimeSeriesChart({ data }: TimeSeriesChartProps) {
  const option = useMemo<EChartsOption>(
    () => ({
      color: ['#2563eb', '#14b8a6', '#f97316'],
      tooltip: {
        trigger: 'axis'
      },
      legend: {
        top: 0,
        right: 0,
        data: ['安装', '付费次数', '收入']
      },
      grid: {
        left: 44,
        right: 24,
        top: 48,
        bottom: 32
      },
      xAxis: {
        type: 'category',
        boundaryGap: false,
        data: data.map((point) => point.date.slice(5))
      },
      yAxis: [
        {
          type: 'value',
          name: '次数'
        },
        {
          type: 'value',
          name: '收入'
        }
      ],
      series: [
        {
          name: '安装',
          type: 'line',
          smooth: true,
          symbolSize: 5,
          data: data.map((point) => point.installs)
        },
        {
          name: '付费次数',
          type: 'line',
          smooth: true,
          symbolSize: 5,
          data: data.map((point) => point.payments)
        },
        {
          name: '收入',
          type: 'bar',
          yAxisIndex: 1,
          barMaxWidth: 18,
          data: data.map((point) => point.revenueUsd)
        }
      ]
    }),
    [data]
  );

  return <BaseEChart ariaLabel="安装与收入趋势图" height={320} option={option} />;
}
