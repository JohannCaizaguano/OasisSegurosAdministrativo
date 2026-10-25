import { ChevronDown } from 'lucide-react';
import type { ComponentProps } from 'react';

import { EstadoInsignia } from '@/components/EstadoInsignia';

import { ESTADOS, type Dominio, type Presentacion } from './estados';

/** Estados del dominio sin repetir los que comparten texto (p. ej. los dos «En proceso»). */
function estadosDistintos(dominio: Dominio): Array<[string, Presentacion]> {
  const vistos = new Set<string>();
  return Object.entries<Presentacion>(ESTADOS[dominio]).filter(([, { texto }]) => {
    if (vistos.has(texto)) {
      return false;
    }
    vistos.add(texto);
    return true;
  });
}

/** Leyenda plegable con `<details>` nativo: sin hover, funciona con teclado y en el celular. */
export function LeyendaEstados({ dominio }: { dominio: Dominio }) {
  return (
    <details data-testid="leyenda-estados" className="rounded-md bg-secondary px-4 py-2">
      <summary className="list-none [&::-webkit-details-marker]:hidden flex min-h-control justify-between gap-2 cursor-pointer items-center font-semibold text-link underline underline-offset-3">
        ¿Qué significa cada estado?
        <ChevronDown
          aria-hidden="true"
          className="size-4 shrink-0 transition-transform [details[open]_&]:rotate-180"
        />
      </summary>
      <dl className="grid gap-3 py-3">
        {estadosDistintos(dominio).map(([estado, { descripcion }]) => (
          <div key={estado} className="grid items-start gap-1.5 sm:grid-cols-[11rem_1fr] sm:gap-4">
            <dt>
              {/* El par dominio/estado viene de ESTADOS[dominio]; TypeScript no lo correlaciona. */}
              <EstadoInsignia {...({ dominio, estado } as ComponentProps<typeof EstadoInsignia>)} />
            </dt>
            <dd className="text-muted-foreground">{descripcion}</dd>
          </div>
        ))}
      </dl>
    </details>
  );
}
