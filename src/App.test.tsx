import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import App from './App';

describe('App shell', () => {
  it('渲染中文 BI 工作区导航和全局筛选', () => {
    render(<App />);

    expect(screen.getByRole('heading', { name: /GameInsight/i })).toBeInTheDocument();

    expect(screen.getByRole('link', { name: /实时看板/i })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /留存分析/i })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /漏斗分析/i })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /用户路径/i })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /配置看板/i })).toBeInTheDocument();

    expect(screen.getByRole('combobox', { name: '国家' })).toBeInTheDocument();
    expect(screen.getByRole('combobox', { name: '平台' })).toBeInTheDocument();
    expect(screen.getByRole('combobox', { name: '渠道' })).toBeInTheDocument();
    expect(screen.getByRole('combobox', { name: '版本' })).toBeInTheDocument();
  });

  it('默认展示实时看板核心指标和图表区域', () => {
    render(<App />);

    expect(screen.getByText('总安装')).toBeInTheDocument();
    expect(screen.getByText('总收入')).toBeInTheDocument();
    expect(screen.getByText('ARPU')).toBeInTheDocument();
    expect(screen.getByText('付费率')).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: '安装与收入趋势' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: '国家收入分布' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: '渠道收入分布' })).toBeInTheDocument();
  });

  it('可以进入留存分析页并展示热力图和同期群明细', () => {
    render(<App />);

    fireEvent.click(screen.getByRole('link', { name: /留存分析/i }));

    expect(screen.getByRole('heading', { name: '留存分析' })).toBeInTheDocument();
    expect(screen.getByText(/20,000 名安装用户/)).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: '留存热力图' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: '同期群明细' })).toBeInTheDocument();
    expect(screen.getByText(/Worker 聚合耗时/)).toBeInTheDocument();
  });
});
