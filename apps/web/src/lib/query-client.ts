import { QueryClient } from '@tanstack/react-query';

import { ApiError } from './api-client';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: (intentos, error) => {
        if (error instanceof ApiError && error.statusCode < 500) {
          return false;
        }
        return intentos < 2;
      },
      staleTime: 15_000,
      refetchOnWindowFocus: false,
    },
  },
});
