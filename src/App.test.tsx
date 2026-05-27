import { render, screen } from '@testing-library/react';
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

    expect(screen.getByLabelText(/国家/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/平台/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/渠道/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/版本/i)).toBeInTheDocument();
  });
});
