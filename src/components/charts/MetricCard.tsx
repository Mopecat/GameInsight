import type { LucideIcon } from 'lucide-react';

interface MetricCardProps {
  title: string;
  value: string;
  helper: string;
  icon: LucideIcon;
}

export function MetricCard({ title, value, helper, icon: Icon }: MetricCardProps) {
  return (
    <article className="metric-card">
      <div className="metric-card-icon" aria-hidden="true">
        <Icon size={20} />
      </div>
      <div>
        <p>{title}</p>
        <strong>{value}</strong>
        <span>{helper}</span>
      </div>
    </article>
  );
}
