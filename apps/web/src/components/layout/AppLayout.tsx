import { FileText, LayoutDashboard, Menu, Receipt, ShieldCheck, Users } from 'lucide-react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';

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
import { useLogout } from '@/features/auth/hooks';
import { useAuthStore } from '@/lib/auth-store';
import { cn } from '@/lib/utils';

const ENLACES = [
  { a: '/', texto: 'Inicio', icono: LayoutDashboard, roles: ['ADMIN', 'OPERADOR', 'CLIENTE'] },
  { a: '/pagos', texto: 'Pagos', icono: FileText, roles: ['ADMIN', 'OPERADOR'] },
  { a: '/recibos', texto: 'Recibos', icono: Receipt, roles: ['ADMIN', 'OPERADOR'] },
  { a: '/clientes', texto: 'Clientes', icono: Users, roles: ['ADMIN', 'OPERADOR'] },
  { a: '/polizas', texto: 'Pólizas', icono: ShieldCheck, roles: ['ADMIN', 'OPERADOR'] },
];

type Enlace = (typeof ENLACES)[number];

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

function Navegacion({ enlaces, navegar }: { enlaces: Enlace[]; navegar: () => void }) {
  return (
    <>
      <nav className="flex flex-1 flex-col gap-1" aria-label="Navegación principal">
        {enlaces.map(({ a, texto, icono: Icono }) => (
          <NavLink
            key={a}
            to={a}
            end={a === '/'}
            onClick={navegar}
            className={({ isActive }) => claseEnlace(isActive)}
          >
            <Icono className="size-4" aria-hidden="true" />
            {texto}
          </NavLink>
        ))}
      </nav>
      <div className="border-t p-3">
        <Button variant="ghost" className="w-full justify-start gap-2" onClick={navegar}>
          <Receipt className="size-4" aria-hidden="true" />
          Verificación pública
        </Button>
      </div>
    </>
  );
}

export function AppLayout() {
  const usuario = useAuthStore((estado) => estado.usuario);
  const logout = useLogout();
  const navegar = useNavigate();

  const enlaces = ENLACES.filter((enlace) => usuario && enlace.roles.includes(usuario.rol));

  return (
    <div className="flex min-h-screen">
      <aside className="hidden w-60 shrink-0 border-r bg-[var(--card)] md:flex md:flex-col">
        <div className="flex h-14 items-center border-b px-5">
          <Marca />
        </div>
        <div className="flex flex-1 flex-col">
          <Navegacion enlaces={enlaces} navegar={() => navegar('/verificar')} />
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
              <Navegacion enlaces={enlaces} navegar={() => undefined} />
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
                <DropdownMenuItem
                  data-testid="boton-logout"
                  onSelect={() => {
                    // `useLogout` limpia el estado; el guard de ruta redirige solo.
                    logout.mutate();
                  }}
                >
                  Cerrar sesión
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </header>
        <main id="contenido" className="flex-1 p-4 sm:p-5">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
