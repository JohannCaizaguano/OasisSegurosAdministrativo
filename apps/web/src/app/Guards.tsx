import type { Rol } from '@oasis/shared';
import { Navigate, Outlet, useLocation } from 'react-router-dom';

import { useAuthStore } from '@/lib/auth-store';

interface Props {
  roles?: Rol[];
}

/** Exige sesión activa y, opcionalmente, uno de los roles indicados. */
export function RutaProtegida({ roles }: Props) {
  const { autenticado, usuario } = useAuthStore();
  const ubicacion = useLocation();

  if (!autenticado || !usuario) {
    return <Navigate to="/login" state={{ desde: ubicacion }} replace />;
  }

  if (roles && roles.length > 0 && !roles.includes(usuario.rol)) {
    return <Navigate to="/" replace />;
  }

  return <Outlet />;
}
