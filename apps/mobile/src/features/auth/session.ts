import { ApiError, request, setSessionExpiredHandler } from '../../lib/api';
import { queryClient } from '../../lib/queryClient';
import { tokenStorage } from '../../lib/tokenStorage';
import { useAuthStore } from '../../stores/authStore';
import type { AuthResponse, SessionUser } from '../../types/api';

setSessionExpiredHandler(() => {
  queryClient.clear();
  useAuthStore.getState().setSignedOut();
});

async function finishSignIn(res: AuthResponse) {
  await tokenStorage.save(res.tokens);
  queryClient.clear();
  useAuthStore.getState().setSignedIn(res.user);
}

export async function bootstrapSession() {
  const store = useAuthStore.getState();
  store.setLoading();

  const tokens = await tokenStorage.load();
  if (!tokens) {
    store.setSignedOut();
    return;
  }
  try {
    const { user } = await request<{ user: SessionUser }>('/auth/me');
    store.setSignedIn(user);
  } catch (err) {
    if (err instanceof ApiError && err.code !== 'NETWORK_ERROR' && err.status < 500) {
      await tokenStorage.clear();
      store.setSignedOut();
    } else {
      store.setError(); // Server or network trouble: keep the saved session and offer a retry.
    }
  }
}

export async function signIn(phone: string, password: string) {
  const res = await request<AuthResponse>('/auth/login', { method: 'POST', body: { phone, password }, auth: false });
  await finishSignIn(res);
}

export async function registerCustomer(input: { fullName: string; phone: string; email?: string; password: string }) {
  const res = await request<AuthResponse>('/auth/register/customer', { method: 'POST', body: input, auth: false });
  await finishSignIn(res);
}

export async function signOut() {
  const tokens = await tokenStorage.load();
  if (tokens) {
    // Best effort: the local sign-out must not wait for the network.
    request('/auth/logout', { method: 'POST', body: { refreshToken: tokens.refreshToken }, auth: false }).catch(() => {});
  }
  await tokenStorage.clear();
  queryClient.clear();
  useAuthStore.getState().setSignedOut();
}