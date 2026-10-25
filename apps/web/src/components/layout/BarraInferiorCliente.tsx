import { CircleUserRound, House, Receipt, ShieldCheck, type LucideIcon } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';

interface Pestana {
  a: string;
  texto: string;
  icono: LucideIcon;
}

// ponytail: Pólizas y Recibos son anclas del PanelCliente hasta que HU-29 (S6) les dé página.
const PESTANAS: Pestana[] = [
  { a: '/', texto: 'Inicio', icono: House },
  { a: '/#polizas', texto: 'Pólizas', icono: ShieldCheck },
  { a: '/#pagos', texto: 'Recibos', icono: Receipt },
  { a: '/cuenta/contrasena', texto: 'Cuenta', icono: CircleUserRound },
];

const ANCLAS = new Set(PESTANAS.map(({ a }) => a));

/**
 * Pestañas del portal del cliente: barra inferior de papel en el teléfono y fila bajo la cabecera
 * desde 760 px (DESIGN.md §Navigation).
 */
export function BarraInferiorCliente() {
  const { pathname, hash } = useLocation();
  const conAncla = `${pathname}${hash}`;
  const actual = ANCLAS.has(conAncla) ? conAncla : pathname;

  return (
    <nav
      aria-label="Secciones del portal"
      data-barra="portal"
      className="fixed inset-x-0 bottom-0 z-30 bg-card pb-[env(safe-area-inset-bottom)] shadow-[inset_0_1px_0_var(--border)] riel:sticky riel:top-0 riel:bottom-auto riel:shadow-[inset_0_-1px_0_var(--border)]"
    >
      <ul className="mx-auto grid max-w-5xl grid-cols-4 riel:flex riel:gap-1 riel:px-[14px]">
        {PESTANAS.map(({ a, texto, icono: Icono }) => (
          <li key={a}>
            <Link
              to={a}
              aria-current={actual === a ? 'page' : undefined}
              className="flex min-h-16 flex-col items-center justify-center gap-0.5 text-mini text-muted-foreground hover:text-foreground aria-[current=page]:font-bold aria-[current=page]:text-link riel:min-h-control riel:flex-row riel:gap-2 riel:px-4 riel:text-label"
            >
              <Icono aria-hidden="true" className="size-[22px]" />
              {texto}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}
