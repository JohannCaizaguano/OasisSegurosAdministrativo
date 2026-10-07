import type { Rol } from '@oasis/shared';
import {
  Building2,
  FileText,
  LayoutDashboard,
  Menu,
  Receipt,
  ScanSearch,
  ScrollText,
  ShieldCheck,
  UserCog,
  Users,
  type LucideIcon,
} from 'lucide-react';
import { NavLink, Outlet, Link, useLocation } from 'react-router-dom';

import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { AvisoInactividad } from '@/features/auth/components/AvisoInactividad';
import { useLogout } from '@/features/auth/hooks';
import { useAuthStore } from '@/lib/auth-store';
import { cn } from '@/lib/utils';

interface Enlace {
  a: string;
  texto: string;
  icono: LucideIcon;
  roles: Rol[];
  /** Prefijo que este enlace cede a otro más específico (p. ej. /recibos a /recibos/verificar). */
  excluye?: string;
}

const ENLACES: Enlace[] = [
  { a: '/', texto: 'Inicio', icono: LayoutDashboard, roles: ['ADMIN', 'OPERADOR', 'CLIENTE'] },
  { a: '/pagos', texto: 'Pagos', icono: FileText, roles: ['ADMIN', 'OPERADOR'] },
  {
    a: '/recibos',
    texto: 'Recibos',
    icono: Receipt,
    roles: ['ADMIN', 'OPERADOR'],
    excluye: '/recibos/verificar',
  },
  {
    a: '/recibos/verificar',
    texto: 'Verificar recibo',
    icono: ScanSearch,
    roles: ['ADMIN', 'OPERADOR'],
  },
  { a: '/clientes', texto: 'Clientes', icono: Users, roles: ['ADMIN', 'OPERADOR'] },
  { a: '/polizas', texto: 'Pólizas', icono: ShieldCheck, roles: ['ADMIN', 'OPERADOR'] },
  { a: '/aseguradoras', texto: 'Aseguradoras', icono: Building2, roles: ['ADMIN', 'OPERADOR'] },
  { a: '/usuarios', texto: 'Usuarios', icono: UserCog, roles: ['ADMIN'] },
  { a: '/bitacora', texto: 'Bitácora', icono: ScrollText, roles: ['ADMIN'] },
];

function claseEnlace(activo: boolean): string {
  return cn(
    'flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition-colors',
    activo
      ? 'bg-[var(--primary)] text-[var(--primary-foreground)]'
      : 'text-[var(--muted-foreground)] hover:bg-[var(--accent)] hover:text-[var(--foreground)]',
  );
}

function Marca() {
  return (
    <div className="flex items-center gap-2">
      <ShieldCheck className="size-5 text-[var(--primary)]" aria-hidden="true" />
      <span className="font-semibold">Oasis Seguros</span>
    </div>
  );
}

function Navegacion({ enlaces }: { enlaces: Enlace[] }) {
  const { pathname } = useLocation();

  return (
    <nav className="flex flex-1 flex-col gap-1" aria-label="Navegación principal">
      {enlaces.map(({ a, texto, icono: Icono, excluye }) => (
        <NavLink
          key={a}
          to={a}
          end={a === '/'}
          className={({ isActive }) =>
            claseEnlace(isActive && !(excluye && pathname.startsWith(excluye)))
          }
        >
          <Icono className="size-4" aria-hidden="true" />
          {texto}
        </NavLink>
      ))}
    </nav>
  );
}

export function AppLayout() {
  const usuario = useAuthStore((estado) => estado.usuario);
  const logout = useLogout();

  const enlaces = ENLACES.filter((enlace) => usuario && enlace.roles.includes(usuario.rol));

  return (
    <div className="flex min-h-screen">
      <aside className="hidden w-60 shrink-0 border-r bg-[var(--card)] md:flex md:flex-col">
        <div className="flex h-14 items-center border-b px-5">
          <Marca />
        </div>
        <div className="flex flex-1 flex-col">
          <Navegacion enlaces={enlaces} />
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex h-14 items-center justify-between gap-3 border-b bg-[var(--card)] px-4 sm:px-5">
          <Sheet>
            <SheetTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="md:hidden"
                aria-label="Abrir menú de navegación"
                data-testid="abrir-menu"
              >
                <Menu className="size-5" />
              </Button>
            </SheetTrigger>
            <SheetContent className="pt-12">
              <SheetTitle className="sr-only">Navegación principal</SheetTitle>
              <Navegacion enlaces={enlaces} />
            </SheetContent>
          </Sheet>

          <div className="md:hidden">
            <Marca />
          </div>
          <div className="hidden md:block" />

          <div className="ml-auto flex items-center gap-3">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" data-testid="menu-usuario">
                  {usuario?.nombre ?? 'Usuario'}
                </Button>
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
          </div>
        </header>
        <main id="contenido" className="min-w-0 flex-1 p-4 sm:p-5">
          <Outlet />
        </main>
      </div>
      <AvisoInactividad />
    </div>
  );
}
