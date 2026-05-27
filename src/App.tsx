import { Activity, BarChart3, Flame, GitFork, LayoutDashboard, Settings2 } from 'lucide-react';
import { useMemo, useState } from 'react';

import { GlobalFilters } from './components/filters/GlobalFilters';
import type { PageKey } from './types/domain';

const pages: Array<{
  key: PageKey;
  label: string;
  description: string;
  icon: typeof LayoutDashboard;
}> = [
  {
    key: 'dashboard',
    label: '实时看板',
    description: '游戏运营实时监控中心',
    icon: LayoutDashboard
  },
  {
    key: 'retention',
    label: '留存分析',
    description: '留存热力图与虚拟滚动同期群明细',
    icon: Activity
  },
  {
    key: 'funnel',
    label: '漏斗分析',
    description: '从安装到首充的转化链路',
    icon: Flame
  },
  {
    key: 'userPath',
    label: '用户路径',
    description: '基于 G6 的事件流转路径图',
    icon: GitFork
  },
  {
    key: 'builder',
    label: '配置看板',
    description: 'Schema-driven 图表配置能力',
    icon: Settings2
  }
];

const pageCopy: Record<PageKey, { title: string; kicker: string; body: string }> = {
  dashboard: {
    title: '实时运营看板',
    kicker: '实时 BI 驾驶舱',
    body: '面向手游出海运营场景，监控安装、收入、ARPU、付费率等核心指标，并支持国家、平台、渠道、版本等多维下钻。'
  },
  retention: {
    title: '留存分析',
    kicker: 'Cohort 留存表现',
    body: '使用 Web Worker 聚合 D1、D3、D7、D14、D30 留存，并通过虚拟列表查看大规模同期群明细。'
  },
  funnel: {
    title: '转化漏斗分析',
    kicker: '安装到首充',
    body: '对比不同转化窗口，定位玩家在注册、教程、战斗、商店浏览和首充之间的关键流失环节。'
  },
  userPath: {
    title: '用户路径分析',
    kicker: '行为路径图',
    body: '用带权边展示事件转移路径，帮助分析师识别主流玩家旅程、异常分支和行为断点。'
  },
  builder: {
    title: '配置化看板搭建',
    kicker: '自助式 BI',
    body: '通过维度、指标、筛选条件和图表类型生成可序列化 schema，模拟内部 BI 工具的配置化搭建能力。'
  }
};

function App() {
  const [activePage, setActivePage] = useState<PageKey>('dashboard');
  const activeMeta = useMemo(() => pageCopy[activePage], [activePage]);

  return (
    <div className="app-shell">
      <aside className="sidebar" aria-label="主导航">
        <div className="brand-block">
          <div className="brand-mark" aria-hidden="true">
            <BarChart3 size={22} />
          </div>
          <div>
            <h1>GameInsight</h1>
            <p>手游出海 BI</p>
          </div>
        </div>

        <nav className="nav-list">
          {pages.map((page) => {
            const Icon = page.icon;
            const isActive = activePage === page.key;

            return (
              <a
                aria-current={isActive ? 'page' : undefined}
                className={isActive ? 'nav-item nav-item-active' : 'nav-item'}
                href={`#${page.key}`}
                key={page.key}
                onClick={(event) => {
                  event.preventDefault();
                  setActivePage(page.key);
                }}
              >
                <Icon size={18} />
                <span>{page.label}</span>
              </a>
            );
          })}
        </nav>
      </aside>

      <main className="workspace">
        <header className="topbar">
          <div>
            <p className="eyebrow">{activeMeta.kicker}</p>
            <h2>{activeMeta.title}</h2>
          </div>
          <GlobalFilters />
        </header>

        <section className="page-panel" aria-labelledby="page-title">
          <div>
            <p className="eyebrow">第一阶段基础骨架</p>
            <h3 id="page-title">{activeMeta.title}</h3>
            <p>{activeMeta.body}</p>
          </div>
        </section>
      </main>
    </div>
  );
}

export default App;
