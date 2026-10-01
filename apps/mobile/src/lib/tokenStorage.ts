import * as SecureStore from 'expo-secure-store';
import type { Tokens } from '../types/api';

const KEY = 'delifill.session';

export const tokenStorage = {
  async save(tokens: Tokens) {
    const { accessToken, refreshToken } = tokens;
    await SecureStore.setItemAsync(KEY, JSON.stringify({ accessToken, refreshToken }));
  },
  async load(): Promise<Tokens | null> {
    const raw = await SecureStore.getItemAsync(KEY);
    if (!raw) return null;
    try {
      return JSON.parse(raw) as Tokens;
    } catch {
      return null;
    }
  },
  async clear() {
    await SecureStore.deleteItemAsync(KEY);
  },
};