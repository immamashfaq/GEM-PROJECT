import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 60 * 1000,
      gcTime: 5 * 60 * 1000,
      retry: 1,
    },
  },
});

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <QueryClientProvider client={queryClient}>
        <StatusBar style="light" backgroundColor="#080d1a" />
        <Stack
          screenOptions={{
            headerStyle: { backgroundColor: '#080d1a' },
            headerTintColor: '#f0f4ff',
            headerTitleStyle: { fontWeight: '700' },
            contentStyle: { backgroundColor: '#080d1a' },
          }}
        >
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          <Stack.Screen
            name="listings/[id]"
            options={{ title: 'Listing Detail', headerBackTitle: 'Back' }}
          />
          <Stack.Screen
            name="auth/login"
            options={{ title: 'Log In', presentation: 'modal' }}
          />
          <Stack.Screen
            name="auth/register"
            options={{ title: 'Create Account', presentation: 'modal' }}
          />
        </Stack>
      </QueryClientProvider>
    </SafeAreaProvider>
  );
}
