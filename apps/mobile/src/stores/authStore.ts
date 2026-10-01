import { create } from 'zustand';
import type { SessionUser } from '../types/api';

type Status = 'loading' | 'signedOut' | 'signedIn' | 'error';

type AuthState = {
  status: Status;
  user: SessionUser | null;
  setLoading: () => void;
  setSignedIn: (user: SessionUser) => void;
  setSignedOut: () => void;
  setError: () => void;
};

export const useAuthStore = create<AuthState>((set) => ({
  status: 'loading',
  user: null,
  setLoading: () => set({ status: 'loading' }),
  setSignedIn: (user) => set({ status: 'signedIn', user }),
  setSignedOut: () => set({ status: 'signedOut', user: null }),
  setError: () => set({ status: 'error' }),
}));