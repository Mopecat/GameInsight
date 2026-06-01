import { FixedSizeList, type ListChildComponentProps } from 'react-window';

import { ChartPanel } from '../../components/charts/ChartPanel';
import { MetricCard } from '../../components/charts/MetricCard';
import { RetentionHeatmapChart } from '../../components/charts/RetentionHeatmapChart';
import { generateMockGameData } from '../../mock/generator';
import { useRetentionWorker } from '../../hooks/useRetentionWorker';
import { useFilterStore } from '../../store/filterStore';
import { formatInteger, formatPercent } from '../../utils/formatters';
import type { RetentionCohort } from '../../utils/retention';
import { Activity, Clock3, Layers3, Users } from 'lucide-react';

const retentionData = generateMockGameData({
  seed: 'retention-stage-5',
  playerCount: 20_000,
  startDate: '2026-02-01',
  days: 90
});

const retentionDays = [1, 3, 7, 14, 30];

const countryLabels: Record<string, string> = {
  US: '美国',
  JP: '日本',
  KR: '韩国',
  BR: '巴西',
  DE: '德国',
  TH: '泰国'
};

export function RetentionPage() {
  const filters = useFilterStore((state) => state.filters);
  const { analysis, elapsedMs, status } = useRetentionWorker(
    retentionData.players,
    retentionData.events,
    filters,
    retentionDays,
    retentionData.range.endTimestamp
  );

  return (
    <div className="retention-page">
      <section className="dashboard-hero" aria-label="留存分析摘要">
        <div>
          <p className="eyebrow">Web Worker 聚合 + 虚拟列表</p>
          <h3>留存同期群总览</h3>
          <p>
            以安装日期为同期群，观察 D1、D3、D7、D14、D30 留存表现。当前筛选下共
            {formatInteger(analysis.summary.totalUsers)} 名安装用户，{formatInteger(analysis.summary.cohortCount)} 个同期群。
          </p>
        </div>
      </section>

      <section className="metric-grid" aria-label="留存核心指标">
        <MetricCard
          helper="筛选后安装用户"
          icon={Users}
          title="安装用户"
          value={formatInteger(analysis.summary.totalUsers)}
        />
        <MetricCard
          helper="按安装日、国家、平台、渠道、版本切分"
          icon={Layers3}
          title="同期群数量"
          value={formatInteger(analysis.summary.cohortCount)}
        />
        <MetricCard
          helper="加权平均 D1 留存"
          icon={Activity}
          title="D1 留存"
          value={formatNullablePercent(analysis.summary.averageRetention.d1)}
        />
        <MetricCard
          helper={status === 'running' ? 'Worker 正在计算' : '当前筛选聚合完成'}
          icon={Clock3}
          title="Worker 聚合耗时"
          value={status === 'sync' ? '同步预览' : `${elapsedMs.toFixed(1)}ms`}
        />
      </section>

      <div className="retention-grid">
        <ChartPanel subtitle="颜色越深表示对应日期留存越高" title="留存热力图">
          <RetentionHeatmapChart analysis={analysis} />
        </ChartPanel>
        <ChartPanel subtitle="使用 react-window 仅渲染可见行" title="同期群明细">
          <CohortVirtualList cohorts={analysis.cohorts} />
        </ChartPanel>
      </div>
    </div>
  );
}

function CohortVirtualList({ cohorts }: { cohorts: RetentionCohort[] }) {
  if (cohorts.length === 0) {
    return <div className="empty-state">当前筛选下暂无同期群数据</div>;
  }

  return (
    <div className="cohort-list" role="table" aria-label="同期群明细表">
      <div className="cohort-list-header" role="row">
        <span>安装日期</span>
        <span>国家</span>
        <span>规模</span>
        <span>D1</span>
        <span>D7</span>
        <span>D30</span>
      </div>
      <FixedSizeList
        height={360}
        itemCount={cohorts.length}
        itemData={cohorts}
        itemSize={44}
        width="100%"
      >
        {CohortRow}
      </FixedSizeList>
    </div>
  );
}

function CohortRow({ index, style, data }: ListChildComponentProps<RetentionCohort[]>) {
  const cohort = data[index];

  return (
    <div className="cohort-list-row" role="row" style={style}>
      <span>{cohort.installDate}</span>
      <span>{countryLabels[cohort.country]}</span>
      <span>{formatInteger(cohort.size)}</span>
      <span>{formatNullablePercent(cohort.retention.d1)}</span>
      <span>{formatNullablePercent(cohort.retention.d7)}</span>
      <span>{formatNullablePercent(cohort.retention.d30)}</span>
    </div>
  );
}

function formatNullablePercent(value: number | null | undefined) {
  return value == null ? '-' : formatPercent(value);
}
