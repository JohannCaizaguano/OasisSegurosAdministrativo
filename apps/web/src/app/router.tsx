import {
  createBrowserRouter,
  Link,
  Navigate,
  Outlet,
  useLocation,
  type RouteObject,
} from 'react-router-dom';

import { AppLayout } from '@/components/layout/AppLayout';
import { AseguradorasPage } from '@/features/aseguradoras/pages/AseguradorasPage';
import { BitacoraPage } from '@/features/auditoria/pages/BitacoraPage';
import { CarteraPage } from '@/features/cartera/pages/CarteraPage';
import { CambiarContrasenaPage } from '@/features/auth/pages/CambiarContrasenaPage';
import { LoginPage } from '@/features/auth/pages/LoginPage';
import { ClientesPage } from '@/features/clientes/pages/ClientesPage';
import { DashboardPage } from '@/features/dashboard/pages/DashboardPage';
import { PagosPage } from '@/features/pagos/pages/PagosPage';
import { PolizaDetallePage } from '@/features/polizas/pages/PolizaDetallePage';
import { PolizasPage } from '@/features/polizas/pages/PolizasPage';
import { ReciboDetallePage } from '@/features/recibos/pages/ReciboDetallePage';
import { ReciboImprimiblePage } from '@/features/recibos/pages/ReciboImprimiblePage';
import { RecibosPage } from '@/features/recibos/pages/RecibosPage';
import { UsuariosPage } from '@/features/usuarios/pages/UsuariosPage';
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
      <h1 className="text-headline font-bold">Página no encontrada</h1>
      <p className="text-caption text-muted-foreground">
        La dirección solicitada no corresponde a ninguna sección de Oasis Seguros.
      </p>
      <div className="flex justify-center gap-2">
        <Link className="font-semibold text-link underline" to="/">
          Ir al inicio
        </Link>
      </div>
    </div>
  );
}

export const rutas: RouteObject[] = [
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
            // HU-28 (D3): el cliente verifica sus propios recibos; el API decide qué ve.
            element: <RutaProtegida roles={['ADMIN', 'OPERADOR', 'CLIENTE']} />,
            children: [
              { path: '/recibos/verificar', element: <VerificacionPage /> },
              { path: '/recibos/verificar/:codigo', element: <VerificacionPage /> },
            ],
          },
          {
            element: <RutaProtegida roles={['ADMIN', 'OPERADOR']} />,
            children: [
              { path: '/pagos', element: <PagosPage /> },
              { path: '/cartera', element: <CarteraPage /> },
              { path: '/recibos', element: <RecibosPage /> },
              { path: '/recibos/:id', element: <ReciboDetallePage /> },
              { path: '/recibos/:id/imprimir', element: <ReciboImprimiblePage /> },
              { path: '/clientes', element: <ClientesPage /> },
              { path: '/polizas', element: <PolizasPage /> },
              { path: '/polizas/:id', element: <PolizaDetallePage /> },
              { path: '/aseguradoras', element: <AseguradorasPage /> },
            ],
          },
          {
            element: <RutaProtegida roles={['CLIENTE']} />,
            children: [{ path: '/portal/recibos/:id', element: <ReciboImprimiblePage /> }],
          },
          {
            element: <RutaProtegida roles={['ADMIN']} />,
            children: [
              { path: '/bitacora', element: <BitacoraPage /> },
              { path: '/usuarios', element: <UsuariosPage /> },
            ],
          },
          { path: '/cuenta/contrasena', element: <CambiarContrasenaPage /> },
        ],
      },
    ],
  },
  { path: '*', element: <NoEncontrado /> },
];

export const router = createBrowserRouter(rutas);
