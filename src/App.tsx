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
    label: 'Dashboard',
    description: 'Realtime operations command center',
    icon: LayoutDashboard
  },
  {
    key: 'retention',
    label: 'Retention',
    description: 'Cohort heatmap and virtualized player cohorts',
    icon: Activity
  },
  {
    key: 'funnel',
    label: 'Funnel',
    description: 'Install to first payment conversion',
    icon: Flame
  },
  {
    key: 'userPath',
    label: 'User Path',
    description: 'Event transition graph powered by G6',
    icon: GitFork
  },
  {
    key: 'builder',
    label: 'Builder',
    description: 'Schema-driven chart configuration',
    icon: Settings2
  }
];

const pageCopy: Record<PageKey, { title: string; kicker: string; body: string }> = {
  dashboard: {
    title: 'Realtime Operations Dashboard',
    kicker: 'Live BI cockpit',
    body: 'Track installs, revenue, ARPU, pay rate, and multi-dimensional drilldowns across overseas game markets.'
  },
  retention: {
    title: 'Retention Analysis',
    kicker: 'Cohort performance',
    body: 'Aggregate D1, D3, D7, D14, and D30 retention in a Web Worker, then inspect cohort details with virtual scrolling.'
  },
  funnel: {
    title: 'Conversion Funnel',
    kicker: 'Install to first payment',
    body: 'Compare conversion windows and discover where players drop between registration, tutorial, battle, shop, and payment.'
  },
  userPath: {
    title: 'User Path Analysis',
    kicker: 'Behavior graph',
    body: 'Render event transition paths with weighted edges so analysts can identify dominant player journeys and dead ends.'
  },
  builder: {
    title: 'Configurable Chart Builder',
    kicker: 'Self-service BI',
    body: 'Compose chart schemas from dimensions, measures, filters, and chart types to simulate a lightweight internal BI builder.'
  }
};

function App() {
  const [activePage, setActivePage] = useState<PageKey>('dashboard');
  const activeMeta = useMemo(() => pageCopy[activePage], [activePage]);

  return (
    <div className="app-shell">
      <aside className="sidebar" aria-label="Primary navigation">
        <div className="brand-block">
          <div className="brand-mark" aria-hidden="true">
            <BarChart3 size={22} />
          </div>
          <div>
            <h1>GameInsight</h1>
            <p>Mobile game BI</p>
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
            <p className="eyebrow">Stage 1 foundation</p>
            <h3 id="page-title">{activeMeta.title}</h3>
            <p>{activeMeta.body}</p>
          </div>
        </section>
      </main>
    </div>
  );
}

export default App;
