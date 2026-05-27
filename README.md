# GameInsight

GameInsight is a frontend BI demo for overseas mobile game operations. It is designed to simulate an internal data platform used by operations, growth, and data analysis teams.

## Stage 1 Scope

- React + TypeScript + Vite project foundation
- BI-style application shell
- Five workspace entries: Dashboard, Retention, Funnel, User Path, Builder
- Global filters for country, platform, channel, and version
- Zustand store for shared filter state
- Vitest + Testing Library smoke test

## Interview Positioning

This project is not a static dashboard. The target is a simulated game data middle platform covering realtime monitoring, retention analysis, conversion funnels, user path analysis, and schema-driven chart building.

The first stage establishes the frontend architecture that later stages will extend with reusable chart components, mock event generation, Web Worker aggregation, virtual lists, ECharts, and AntV G6.

## Commands

```bash
npm install
npm run dev
npm test
npm run build
```
