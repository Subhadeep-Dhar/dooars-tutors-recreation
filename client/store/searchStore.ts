import { create } from 'zustand';
import { SearchParams, SearchResultProfile } from '@dooars/shared';
import api from '@/lib/api';

interface SearchState {
  params: SearchParams;
  results: SearchResultProfile[];
  total: number;
  totalPages: number;
  isLoading: boolean;
  setParams: (params: Partial<SearchParams>) => void;
  search: (params?: Partial<SearchParams>) => Promise<void>;
  reset: () => void;
}

const defaultParams: SearchParams = {
  page: 1,
  limit: 20,
  sort: 'rating',
};

export const useSearchStore = create<SearchState>((set, get) => ({
  params: defaultParams,
  results: [],
  total: 0,
  totalPages: 0,
  isLoading: false,

  setParams: (newParams) => {
    set((state) => ({ params: { ...state.params, ...newParams } }));
  },

  search: async (overrideParams) => {
    set({ isLoading: true });
    try {
      const params = { ...get().params, ...overrideParams };
      // Remove undefined values
      const clean = Object.fromEntries(
        Object.entries(params).filter(([, v]) => v !== undefined && v !== '')
      );
      const { data } = await api.get('/search', { params: clean });
      set({
        results: data.data,
        total: data.total,
        totalPages: data.totalPages,
        params,
        isLoading: false,
      });
    } catch {
      set({ isLoading: false });
    }
  },

  reset: () => set({ params: defaultParams, results: [], total: 0 }),
}));