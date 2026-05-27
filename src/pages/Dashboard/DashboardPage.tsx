import { BadgeDollarSign, CreditCard, Download, Percent } from 'lucide-react';
import { useMemo } from 'react';

import { ChartPanel } from '../../components/charts/ChartPanel';
import { DimensionBarChart } from '../../components/charts/DimensionBarChart';
import { MetricCard } from '../../components/charts/MetricCard';
import { TimeSeriesChart } from '../../components/charts/TimeSeriesChart';
import { generateMockGameData } from '../../mock/generator';
import { useFilterStore } from '../../store/filterStore';
import { buildDashboardSnapshot } from '../../utils/aggregations';
import { formatCurrency, formatDecimalCurrency, formatInteger, formatPercent } from '../../utils/formatters';

const dashboardData = generateMockGameData({
  seed: 'dashboard-stage-3',
  playerCount: 2600,
  startDate: '2026-04-01',
  days: 30
});

export function DashboardPage() {
  const filters = useFilterStore((state) => state.filters);
  const snapshot = useMemo(
    () => buildDashboardSnapshot(dashboardData.events, filters, dashboardData.range),
    [filters]
  );
  const metrics = snapshot.metrics;

  return (
    <div className="dashboard-page">
      <section className="dashboard-hero" aria-label="实时看板摘要">
        <div>
          <p className="eyebrow">模拟最近 30 天运营数据</p>
          <h3>手游出海实时运营总览</h3>
          <p>
            数据由 mock 事件流生成，当前筛选下共匹配 {formatInteger(snapshot.filteredEvents.length)} 条事件。
          </p>
        </div>
      </section>

      <section className="metric-grid" aria-label="核心指标">
        <MetricCard
          helper={`${formatInteger(metrics.registrations)} 注册，${formatInteger(metrics.tutorialCompletions)} 完成教程`}
          icon={Download}
          title="总安装"
          value={formatInteger(metrics.installs)}
        />
        <MetricCard
          helper={`${formatInteger(metrics.payingUsers)} 名付费用户`}
          icon={BadgeDollarSign}
          title="总收入"
          value={formatCurrency(metrics.revenueUsd)}
        />
        <MetricCard
          helper="收入 / 安装用户"
          icon={CreditCard}
          title="ARPU"
          value={formatDecimalCurrency(metrics.arpuUsd)}
        />
        <MetricCard
          helper="付费用户 / 安装用户"
          icon={Percent}
          title="付费率"
          value={formatPercent(metrics.payRate)}
        />
      </section>

      <div className="dashboard-grid">
        <ChartPanel subtitle="按天查看安装、付费次数和收入变化" title="安装与收入趋势">
          <TimeSeriesChart data={snapshot.trend} />
        </ChartPanel>
        <ChartPanel subtitle="按国家对比收入规模和安装量" title="国家收入分布">
          <DimensionBarChart ariaLabel="国家收入分布图" data={snapshot.countryDistribution} />
        </ChartPanel>
        <ChartPanel subtitle="按获客渠道对比收入规模和安装量" title="渠道收入分布">
          <DimensionBarChart ariaLabel="渠道收入分布图" data={snapshot.channelDistribution} />
        </ChartPanel>
      </div>
    </div>
  );
}
