import type { EChartsOption } from 'echarts';
import { useMemo } from 'react';

import { BaseEChart } from './BaseEChart';
import type { RetentionAnalysis } from '../../utils/retention';

interface RetentionHeatmapChartProps {
  analysis: RetentionAnalysis;
}

type RetentionKey = `d${number}`;

interface VisibleRetentionGroup {
  id: string;
  installDate: string;
  country: string;
  size: number;
  retention: Record<RetentionKey, number | null>;
}

const countryLabels: Record<string, string> = {
  US: '美国',
  JP: '日本',
  KR: '韩国',
  BR: '巴西',
  DE: '德国',
  TH: '泰国'
};

export function RetentionHeatmapChart({ analysis }: RetentionHeatmapChartProps) {
  const visibleCohorts = useMemo(() => pickVisibleCohorts(analysis), [analysis]);
  const option = useMemo<EChartsOption>(
    () => ({
      tooltip: {
        position: 'top',
        formatter: (params) => {
          const value = getHeatmapValue(params);
          const rate = typeof value[2] === 'number' ? `${(value[2] * 100).toFixed(1)}%` : '-';
          return `留存率：${rate}`;
        }
      },
      grid: {
        left: 128,
        right: 24,
        top: 36,
        bottom: 42
      },
      xAxis: {
        type: 'category',
        data: analysis.days.map((day) => `D${day}`)
      },
      yAxis: {
        type: 'category',
        data: visibleCohorts.map((cohort) => `${cohort.installDate} ${countryLabels[cohort.country]}`)
      },
      visualMap: {
        min: 0,
        max: 0.65,
        calculable: true,
        orient: 'horizontal',
        left: 'center',
        bottom: 0,
        inRange: {
          color: ['#eff6ff', '#93c5fd', '#2563eb', '#0f766e']
        }
      },
      series: [
        {
          name: '留存率',
          type: 'heatmap',
          data: visibleCohorts.flatMap((cohort, yIndex) =>
            analysis.days.map((day, xIndex) => [xIndex, yIndex, cohort.retention[`d${day}`]])
          ),
          label: {
            show: true,
            formatter: (params) => {
              const value = getHeatmapValue(params)[2];
              return typeof value === 'number' ? `${Math.round(value * 100)}%` : '';
            }
          },
          emphasis: {
            itemStyle: {
              borderColor: '#111827',
              borderWidth: 1
            }
          }
        }
      ]
    }),
    [analysis, visibleCohorts]
  );

  return <BaseEChart ariaLabel="留存热力图" height={360} option={option} />;
}

function pickVisibleCohorts(analysis: RetentionAnalysis) {
  const groups = aggregateCohortsByDateAndCountry(analysis);
  const cohortsWithSignal = groups.filter((cohort) =>
    analysis.days.some((day) => {
      const value = cohort.retention[`d${day}`];
      return typeof value === 'number' && value > 0;
    })
  );
  const candidates = cohortsWithSignal.length > 0 ? cohortsWithSignal : groups;

  return [...candidates]
    .sort((left, right) => {
      if (left.size !== right.size) {
        return right.size - left.size;
      }
      return right.installDate.localeCompare(left.installDate);
    })
    .slice(0, 18)
    .reverse();
}

function aggregateCohortsByDateAndCountry(analysis: RetentionAnalysis): VisibleRetentionGroup[] {
  const groups = new Map<
    string,
    {
      installDate: string;
      country: string;
      size: number;
      retainedUsers: Record<RetentionKey, number>;
      matureUsers: Record<RetentionKey, number>;
    }
  >();

  analysis.cohorts.forEach((cohort) => {
    const id = `${cohort.installDate}__${cohort.country}`;
    const current =
      groups.get(id) ??
      {
        installDate: cohort.installDate,
        country: cohort.country,
        size: 0,
        retainedUsers: buildEmptyDayRecord(analysis.days),
        matureUsers: buildEmptyDayRecord(analysis.days)
      };

    current.size += cohort.size;
    analysis.days.forEach((day) => {
      const key = `d${day}` as RetentionKey;

      if (cohort.matureDays[key]) {
        current.matureUsers[key] += cohort.size;
        current.retainedUsers[key] += cohort.retainedUsers[key] ?? 0;
      }
    });
    groups.set(id, current);
  });

  return [...groups.entries()].map(([id, group]) => ({
    id,
    installDate: group.installDate,
    country: group.country,
    size: group.size,
    retention: Object.fromEntries(
      analysis.days.map((day) => {
        const key = `d${day}` as RetentionKey;
        const matureUsers = group.matureUsers[key];
        const value = matureUsers === 0 ? null : Number((group.retainedUsers[key] / matureUsers).toFixed(4));

        return [key, value];
      })
    ) as Record<RetentionKey, number | null>
  }));
}

function buildEmptyDayRecord(days: number[]): Record<RetentionKey, number> {
  return Object.fromEntries(days.map((day) => [`d${day}`, 0])) as Record<RetentionKey, number>;
}

function getHeatmapValue(params: unknown) {
  const point = Array.isArray(params) ? params[0] : params;

  if (point && typeof point === 'object' && 'value' in point && Array.isArray(point.value)) {
    return point.value;
  }

  return [];
}
