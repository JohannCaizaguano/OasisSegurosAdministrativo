import type { Rol } from '@oasis/shared';
import {
  Building2,
  FileText,
  LayoutDashboard,
  Receipt,
  ScanSearch,
  ScrollText,
  ShieldCheck,
  UserCog,
  Users,
  type LucideIcon,
} from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';

import isologo from '@/assets/isologo-oasis.png';

import { MenuUsuario } from './MenuUsuario';

interface Enlace {
  a: string;
  texto: string;
  icono: LucideIcon;
  roles: Rol[];
  /** Prefijo que este enlace cede a otro más específico (p. ej. /recibos a /recibos/verificar). */
  excluye?: string;
}

const ENLACES: Enlace[] = [
  { a: '/', texto: 'Inicio', icono: LayoutDashboard, roles: ['ADMIN', 'OPERADOR'] },
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

function estaActivo({ a, excluye }: Enlace, ruta: string): boolean {
  if (a === '/') {
    return ruta === '/';
  }
  const coincide = ruta === a || ruta.startsWith(`${a}/`);
  return coincide && !(excluye && ruta.startsWith(excluye));
}

/**
 * Riel de 92 px en la noche del oasis (DESIGN.md §Navigation). Por debajo de 760 px pasa a una
 * barra superior horizontal con desplazamiento.
 */
export function RielPersonal({ rol }: { rol: Rol }) {
  const { pathname } = useLocation();
  const enlaces = ENLACES.filter((enlace) => enlace.roles.includes(rol));

  return (
    <nav
      aria-label="Navegación principal"
      data-superficie="noche"
      data-barra="riel"
      className="sticky top-0 z-30 flex items-center gap-1 overflow-x-auto bg-sidebar p-2 text-sidebar-foreground riel:h-dvh riel:w-riel riel:shrink-0 riel:flex-col riel:items-stretch riel:gap-1.5 riel:overflow-x-hidden riel:overflow-y-auto riel:px-2 riel:py-[18px]"
    >
      <img
        src={isologo}
        alt="Oasis Seguros"
        width={52}
        height={52}
        className="mr-1.5 size-10 shrink-0 object-contain riel:mx-auto riel:mb-3 riel:size-[52px]"
      />
      <ul className="flex gap-1 riel:flex-col riel:gap-1.5">
        {enlaces.map((enlace) => {
          const { a, texto, icono: Icono } = enlace;
          const activo = estaActivo(enlace, pathname);
          return (
            <li key={a} className="shrink-0">
              <Link
                to={a}
                aria-current={activo ? 'page' : undefined}
                className="flex min-h-[52px] min-w-[72px] flex-col items-center justify-center gap-1 rounded-md px-1 py-2 text-center text-mini leading-tight text-sidebar-foreground hover:bg-sidebar-accent aria-[current=page]:bg-sidebar-accent aria-[current=page]:font-bold aria-[current=page]:text-sidebar-primary riel:min-h-14"
              >
                <Icono
                  aria-hidden="true"
                  className={
                    activo ? 'size-[22px] text-sidebar-primary' : 'size-[22px] text-sidebar-muted'
                  }
                />
                {texto}
              </Link>
            </li>
          );
        })}
      </ul>
      <div className="ml-auto shrink-0 pl-2 riel:mt-auto riel:ml-0 riel:self-center riel:pl-0">
        <MenuUsuario />
      </div>
    </nav>
  );
}
