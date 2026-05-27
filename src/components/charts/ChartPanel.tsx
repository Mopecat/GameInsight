import type { ReactNode } from 'react';

interface ChartPanelProps {
  title: string;
  subtitle: string;
  children: ReactNode;
}

export function ChartPanel({ title, subtitle, children }: ChartPanelProps) {
  return (
    <section className="chart-panel" aria-labelledby={`${title}-title`}>
      <div className="chart-panel-header">
        <div>
          <h3 id={`${title}-title`}>{title}</h3>
          <p>{subtitle}</p>
        </div>
      </div>
      {children}
    </section>
  );
}
