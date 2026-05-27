import { create } from 'zustand';

import type { FilterKey, GlobalFilters } from '../types/domain';

const defaultFilters: GlobalFilters = {
  country: 'all',
  platform: 'all',
  channel: 'all',
  version: 'all'
};

interface FilterStore {
  filters: GlobalFilters;
  setFilter: (key: FilterKey, value: string) => void;
  resetFilters: () => void;
}

export const useFilterStore = create<FilterStore>((set) => ({
  filters: defaultFilters,
  setFilter: (key, value) =>
    set((state) => ({
      filters: {
        ...state.filters,
        [key]: value
      }
    })),
  resetFilters: () => set({ filters: defaultFilters })
}));
