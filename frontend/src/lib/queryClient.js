import { QueryClient } from '@tanstack/react-query';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 2,       // 2 minutes — data stays fresh
      gcTime: 1000 * 60 * 10,          // 10 minutes — garbage collect after
      refetchOnWindowFocus: true,       // Auto-refresh when user returns
      retry: 2,                         // Retry failed requests twice
      refetchOnReconnect: true,         // Refresh when network reconnects
    },
    mutations: {
      retry: 1,
    },
  },
});
