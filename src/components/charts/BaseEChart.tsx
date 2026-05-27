import * as echarts from 'echarts';
import type { EChartsOption } from 'echarts';
import { useEffect, useRef } from 'react';

interface BaseEChartProps {
  option: EChartsOption;
  height?: number;
  ariaLabel: string;
}

export function BaseEChart({ option, height = 280, ariaLabel }: BaseEChartProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!containerRef.current || isTestRuntime()) {
      return undefined;
    }

    const chart = echarts.init(containerRef.current);
    chart.setOption(option, true);

    const resizeObserver = new ResizeObserver(() => {
      chart.resize();
    });
    resizeObserver.observe(containerRef.current);

    return () => {
      resizeObserver.disconnect();
      chart.dispose();
    };
  }, [option]);

  return (
    <div
      aria-label={ariaLabel}
      className="chart-canvas"
      ref={containerRef}
      role="img"
      style={{ height }}
    />
  );
}

function isTestRuntime(): boolean {
  return typeof navigator !== 'undefined' && navigator.userAgent.includes('jsdom');
}
