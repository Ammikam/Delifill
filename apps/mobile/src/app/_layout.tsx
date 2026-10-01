import { useEffect } from 'react';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { QueryClientProvider } from '@tanstack/react-query';
import { ErrorState, LoadingState } from '../components/ui';
import { bootstrapSession } from '../features/auth/session';
import { queryClient } from '../lib/queryClient';
import { useAuthStore } from '../stores/authStore';

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const status = useAuthStore((s) => s.status);
  const user = useAuthStore((s) => s.user);

  useEffect(() => {
    bootstrapSession();
  }, []);

  useEffect(() => {
    if (status !== 'loading') SplashScreen.hideAsync();
  }, [status]);

  if (status === 'loading') return <LoadingState />;
  if (status === 'error') {
    return (
      <ErrorState
        title="Can't connect"
        message="We couldn't reach Delifill. Check your internet connection and try again."
        onRetry={bootstrapSession}
      />
    );
  }

  const signedIn = status === 'signedIn';
  const isCustomer = signedIn && user?.role === 'CUSTOMER';

  return (
    <QueryClientProvider client={queryClient}>
      <StatusBar style="dark" />
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Protected guard={!signedIn}>
          <Stack.Screen name="(auth)" />
        </Stack.Protected>
        <Stack.Protected guard={isCustomer}>
          <Stack.Screen name="(tabs)" />
        </Stack.Protected>
        <Stack.Protected guard={signedIn && !isCustomer}>
          <Stack.Screen name="unsupported" />
        </Stack.Protected>
      </Stack>
    </QueryClientProvider>
  );
}