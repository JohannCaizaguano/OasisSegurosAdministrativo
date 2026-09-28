import { Bell, FileText, LayoutDashboard, Receipt, ShieldCheck, Users } from 'lucide-react';
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
import { useAuthStore } from '@/lib/auth-store';
import { cn } from '@/lib/utils';
import { useLogout } from '@/features/auth/hooks';

const ENLACES = [
  { a: '/', texto: 'Inicio', icono: LayoutDashboard, roles: ['ADMIN', 'OPERADOR', 'CLIENTE'] },
  { a: '/pagos', texto: 'Pagos', icono: FileText, roles: ['ADMIN', 'OPERADOR'] },
  { a: '/recibos', texto: 'Recibos', icono: Receipt, roles: ['ADMIN', 'OPERADOR'] },
  { a: '/clientes', texto: 'Clientes', icono: Users, roles: ['ADMIN', 'OPERADOR'] },
  { a: '/polizas', texto: 'Pólizas', icono: ShieldCheck, roles: ['ADMIN', 'OPERADOR'] },
];

export function AppLayout() {
  const usuario = useAuthStore((estado) => estado.usuario);
  const logout = useLogout();
  const navegar = useNavigate();

  const enlaces = ENLACES.filter((enlace) => usuario && enlace.roles.includes(usuario.rol));

  return (
    <div className="flex min-h-screen">
      <aside className="hidden w-60 shrink-0 border-r bg-[var(--card)] md:flex md:flex-col">
        <div className="flex h-14 items-center gap-2 border-b px-5">
          <ShieldCheck className="size-5 text-[var(--primary)]" />
          <span className="font-semibold">Oasis Seguros</span>
        </div>
        <nav className="flex flex-1 flex-col gap-1 p-3">
          {enlaces.map(({ a, texto, icono: Icono }) => (
            <NavLink
              key={a}
              to={a}
              end={a === '/'}
              className={({ isActive }) =>
                cn(
                  'flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition-colors',
                  isActive
                    ? 'bg-[var(--primary)] text-[var(--primary-foreground)]'
                    : 'text-[var(--muted-foreground)] hover:bg-[var(--accent)] hover:text-[var(--foreground)]',
                )
              }
            >
              <Icono className="size-4" />
              {texto}
            </NavLink>
          ))}
        </nav>
        <div className="border-t p-3">
          <Button
            variant="ghost"
            className="w-full justify-start gap-2"
            onClick={() => navegar('/verificar')}
          >
            <Receipt className="size-4" />
            Verificación pública
          </Button>
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex h-14 items-center justify-between border-b bg-[var(--card)] px-5">
          <div className="flex items-center gap-2 md:hidden">
            <ShieldCheck className="size-5 text-[var(--primary)]" />
            <span className="font-semibold">Oasis Seguros</span>
          </div>
          <div className="ml-auto flex items-center gap-3">
            <Button variant="ghost" size="icon" aria-label="Notificaciones">
              <Bell className="size-4" />
            </Button>
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
                    logout.mutate(undefined, {
                      onSettled: () => navegar('/login', { replace: true }),
                    });
                  }}
                >
                  Cerrar sesión
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </header>
        <main className="flex-1 p-5">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
