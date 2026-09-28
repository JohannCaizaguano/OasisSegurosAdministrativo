import { createBrowserRouter, Navigate, Outlet } from 'react-router-dom';

import { AppLayout } from '@/components/layout/AppLayout';
import { LoginPage } from '@/features/auth/pages/LoginPage';
import { ClientesPage } from '@/features/clientes/pages/ClientesPage';
import { DashboardPage } from '@/features/dashboard/pages/DashboardPage';
import { PagosPage } from '@/features/pagos/pages/PagosPage';
import { PolizasPage } from '@/features/polizas/pages/PolizasPage';
import { ReciboDetallePage } from '@/features/recibos/pages/ReciboDetallePage';
import { RecibosPage } from '@/features/recibos/pages/RecibosPage';
import { VerificacionPage } from '@/features/verificacion/pages/VerificacionPage';
import { useAuthStore } from '@/lib/auth-store';

import { RutaProtegida } from './guards';

/** Redirige al inicio a los usuarios ya autenticados que visitan /login. */
function SoloInvitados() {
  const autenticado = useAuthStore((estado) => estado.autenticado);
  return autenticado ? <Navigate to="/" replace /> : <Outlet />;
}

export const router = createBrowserRouter([
  {
    element: <SoloInvitados />,
    children: [{ path: '/login', element: <LoginPage /> }],
  },
  { path: '/verificar', element: <VerificacionPage /> },
  { path: '/verificar/:codigo', element: <VerificacionPage /> },
  {
    element: <RutaProtegida />,
    children: [
      {
        element: <AppLayout />,
        children: [
          { path: '/', element: <DashboardPage /> },
          {
            element: <RutaProtegida roles={['ADMIN', 'OPERADOR']} />,
            children: [
              { path: '/pagos', element: <PagosPage /> },
              { path: '/recibos', element: <RecibosPage /> },
              { path: '/recibos/:id', element: <ReciboDetallePage /> },
              { path: '/clientes', element: <ClientesPage /> },
              { path: '/polizas', element: <PolizasPage /> },
            ],
          },
        ],
      },
    ],
  },
  { path: '*', element: <Navigate to="/" replace /> },
]);
