import { createBrowserRouter, Navigate, Outlet, Link, useLocation } from 'react-router-dom';

import { AppLayout } from '@/components/layout/AppLayout';
import { BitacoraPage } from '@/features/auditoria/pages/BitacoraPage';
import { CambiarContrasenaPage } from '@/features/auth/pages/CambiarContrasenaPage';
import { LoginPage } from '@/features/auth/pages/LoginPage';
import { ClientesPage } from '@/features/clientes/pages/ClientesPage';
import { DashboardPage } from '@/features/dashboard/pages/DashboardPage';
import { PagosPage } from '@/features/pagos/pages/PagosPage';
import { PolizasPage } from '@/features/polizas/pages/PolizasPage';
import { ReciboDetallePage } from '@/features/recibos/pages/ReciboDetallePage';
import { RecibosPage } from '@/features/recibos/pages/RecibosPage';
import { VerificacionPage } from '@/features/verificacion/pages/VerificacionPage';
import { useAuthStore } from '@/lib/auth-store';

import { RutaProtegida } from './Guards';

/** Redirige al inicio a los usuarios ya autenticados que visitan /login. */
function SoloInvitados() {
  const autenticado = useAuthStore((estado) => estado.autenticado);
  const ubicacion = useLocation();
  // Vuelve a la página que pidió sesión (D19): desde aquí pasan tanto el login como la restauración.
  const desde = (ubicacion.state as { desde?: { pathname?: string } } | null)?.desde?.pathname;
  return autenticado ? <Navigate to={desde ?? '/'} replace /> : <Outlet />;
}

function NoEncontrado() {
  return (
    <div className="mx-auto grid min-h-screen max-w-lg content-center gap-4 p-6 text-center">
      <h1 className="text-2xl font-semibold">Página no encontrada</h1>
      <p className="text-sm text-[var(--muted-foreground)]">
        La dirección solicitada no corresponde a ninguna sección de Oasis Seguros.
      </p>
      <div className="flex justify-center gap-2">
        <Link className="underline" to="/">
          Ir al inicio
        </Link>
      </div>
    </div>
  );
}

export const router = createBrowserRouter([
  {
    element: <SoloInvitados />,
    children: [{ path: '/login', element: <LoginPage /> }],
  },
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
              { path: '/recibos/verificar', element: <VerificacionPage /> },
              { path: '/recibos/verificar/:codigo', element: <VerificacionPage /> },
              { path: '/recibos/:id', element: <ReciboDetallePage /> },
              { path: '/clientes', element: <ClientesPage /> },
              { path: '/polizas', element: <PolizasPage /> },
            ],
          },
          {
            element: <RutaProtegida roles={['ADMIN']} />,
            children: [{ path: '/bitacora', element: <BitacoraPage /> }],
          },
          { path: '/cuenta/contrasena', element: <CambiarContrasenaPage /> },
        ],
      },
    ],
  },
  { path: '*', element: <NoEncontrado /> },
]);
