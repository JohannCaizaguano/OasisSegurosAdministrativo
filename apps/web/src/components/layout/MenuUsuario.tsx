import { Link } from 'react-router-dom';

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useLogout } from '@/features/auth/hooks';
import { useAuthStore } from '@/lib/auth-store';

function iniciales(nombre: string): string {
  const partes = nombre.trim().split(/\s+/).filter(Boolean);
  const letras = partes.length > 1 ? [partes[0], partes[partes.length - 1]] : partes;
  return letras.map((parte) => parte.charAt(0).toUpperCase()).join('') || '?';
}

/** Avatar con el menú de la cuenta; vive sobre la noche (riel o cabecera del portal). */
export function MenuUsuario() {
  const usuario = useAuthStore((estado) => estado.usuario);
  const logout = useLogout();
  const nombre = usuario?.nombre ?? 'Usuario';

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        className="grid size-control shrink-0 place-items-center rounded-full bg-sidebar-primary text-label font-bold text-sidebar-primary-foreground"
        data-testid="menu-usuario"
      >
        <span aria-hidden="true">{iniciales(nombre)}</span>
        <span className="sr-only">Cuenta de {nombre}</span>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuLabel>
          {usuario?.email}
          <span className="mt-0.5 block font-normal">{usuario?.rol}</span>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <Link to="/cuenta/contrasena" data-testid="enlace-cambiar-contrasena">
            Cambiar contraseña
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem
          data-testid="boton-logout"
          onSelect={() => {
            // `useLogout` limpia el estado; el guard de ruta redirige solo.
            logout.mutate(null);
          }}
        >
          Cerrar sesión
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
