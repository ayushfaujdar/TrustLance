import { create } from 'zustand';
import api from '@/lib/api';
import type { WalletTransaction } from '@/types';

interface WalletState {
  balance: number;
  escrowBalance: number;
  transactions: WalletTransaction[];
  isLoading: boolean;

  fetchBalance: () => Promise<void>;
  fetchTransactions: (page?: number, limit?: number, type?: string) => Promise<void>;
  setBalance: (balance: number, escrowBalance: number) => void;
}

export const useWalletStore = create<WalletState>((set) => ({
  balance: 0,
  escrowBalance: 0,
  transactions: [],
  isLoading: false,

  fetchBalance: async () => {
    try {
      const { data } = await api.get('/wallet/balance');
      set({ balance: data.wallet_balance, escrowBalance: data.escrow_balance });
    } catch (error) {
      console.error('Failed to fetch balance:', error);
    }
  },

  fetchTransactions: async (page = 1, limit = 20, type) => {
    set({ isLoading: true });
    try {
      const params = new URLSearchParams({ page: String(page), limit: String(limit) });
      if (type) params.set('type', type);
      const { data } = await api.get(`/wallet/transactions?${params}`);
      set({ transactions: data.data || data });
    } catch (error) {
      console.error('Failed to fetch transactions:', error);
    } finally {
      set({ isLoading: false });
    }
  },

  setBalance: (balance, escrowBalance) => set({ balance, escrowBalance }),
}));
