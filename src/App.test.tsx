import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import App from './App';

describe('App shell', () => {
  it('renders the BI workspace navigation and global filters', () => {
    render(<App />);

    expect(screen.getByRole('heading', { name: /GameInsight/i })).toBeInTheDocument();

    expect(screen.getByRole('link', { name: /Dashboard/i })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Retention/i })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Funnel/i })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /User Path/i })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Builder/i })).toBeInTheDocument();

    expect(screen.getByLabelText(/Country/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Platform/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Channel/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Version/i)).toBeInTheDocument();
  });
});
