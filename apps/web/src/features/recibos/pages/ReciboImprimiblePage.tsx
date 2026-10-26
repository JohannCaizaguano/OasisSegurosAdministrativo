import { ArrowLeft, Printer } from 'lucide-react';
import { Link, useParams } from 'react-router-dom';

import { AvisoError } from '@/components/DataState';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { useAuthStore } from '@/lib/auth-store';

import { ReciboImprimible } from '../components/ReciboImprimible';
import { useReciboImprimible } from '../hooks';

/** `/recibos/:id/imprimir` (personal) y `/portal/recibos/:id` (cliente), D8. */
export function ReciboImprimiblePage() {
  const { id } = useParams<{ id: string }>();
  const esCliente = useAuthStore((estado) => estado.usuario?.rol === 'CLIENTE');
  const consulta = useReciboImprimible(id, esCliente);
  const volver = esCliente
    ? { a: '/', texto: 'Volver al inicio' }
    : { a: `/recibos/${id}`, texto: 'Volver al recibo' };

  return (
    <div className="grid gap-4">
      <div data-no-imprimir className="flex flex-wrap items-center justify-between gap-3">
        <Link
          to={volver.a}
          className="inline-flex min-h-control items-center gap-1.5 font-semibold text-link underline underline-offset-3"
        >
          <ArrowLeft className="size-4" aria-hidden="true" />
          {volver.texto}
        </Link>
        {consulta.data ? (
          <Button onClick={() => window.print()}>
            <Printer aria-hidden="true" /> Imprimir o guardar PDF
          </Button>
        ) : null}
      </div>

      {consulta.isLoading ? (
        <Skeleton className="mx-auto h-[600px] w-full max-w-[720px]" />
      ) : consulta.data ? (
        <ReciboImprimible recibo={consulta.data} />
      ) : (
        <AvisoError error={consulta.error} alReintentar={() => void consulta.refetch()} />
      )}
    </div>
  );
}
