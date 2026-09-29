import { QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'sonner';
import { useEffect, type ReactNode } from 'react';

import { configurarApiClient } from '@/lib/api-client';
import { useAuthStore } from '@/lib/auth-store';
import { queryClient } from '@/lib/query-client';

export function Providers({ children }: { children: ReactNode }) {
  // Registra la limpieza de caché del api-client (requiere el QueryClient).
  useEffect(() => {
    configurarApiClient(() => useAuthStore.getState(), {
      alCerrarSesion: () => queryClient.clear(),
    });
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      {children}
      <Toaster richColors position="top-right" />
    </QueryClientProvider>
  );
}
