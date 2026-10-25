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
      {/* Notificación de noche con el icono en oro (DESIGN.md §Elevation); abajo, sobre la barra del portal. */}
      <Toaster
        position="bottom-center"
        mobileOffset={{ bottom: 88 }}
        toastOptions={{
          classNames: {
            toast:
              'rounded-md! border-0! bg-sidebar! px-4! py-3.5! font-sans! text-cuerpo! text-sidebar-foreground! shadow-lg!',
            description: 'text-sidebar-muted!',
            icon: 'text-sidebar-primary!',
          },
        }}
      />
    </QueryClientProvider>
  );
}
