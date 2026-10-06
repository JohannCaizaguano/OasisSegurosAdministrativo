import type { VerificacionRecibo } from '@oasis/shared';
import { CheckCircle2, CircleHelp, ExternalLink, Search, ShieldAlert, ShieldX } from 'lucide-react';
import { useState, type FormEvent } from 'react';
import { useNavigate, useParams } from 'react-router-dom';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { formatearFecha } from '@/lib/format';

import { useVerificacion } from '../hooks';

const LEYENDAS: Record<
  VerificacionRecibo['estado'],
  { texto: string; variante: 'success' | 'warning' | 'destructive' | 'secondary'; detalle: string }
> = {
  VALIDO: {
    texto: 'Recibo válido',
    variante: 'success',
    detalle: 'El hash recalculado coincide con el registrado en la blockchain.',
  },
  ANULADO: {
    texto: 'Recibo anulado',
    variante: 'warning',
    detalle: 'El emisor anuló este recibo en la cadena.',
  },
  NO_ANCLADO: {
    texto: 'Aún no anclado',
    variante: 'warning',
    detalle: 'El recibo existe pero su anclaje todavía no está confirmado en la cadena.',
  },
  NO_ENCONTRADO: {
    texto: 'Recibo no encontrado',
    variante: 'destructive',
    detalle: 'No existe un recibo con ese código en el sistema.',
  },
  HASH_INCONSISTENTE: {
    texto: 'Hash inconsistente',
    variante: 'destructive',
    detalle: 'El contenido del recibo no coincide con lo registrado en la cadena.',
  },
};

export function VerificacionPage() {
  const { codigo } = useParams<{ codigo: string }>();
  const navegar = useNavigate();
  const [entrada, setEntrada] = useState(codigo ?? '');
  const [codigoPrevio, setCodigoPrevio] = useState(codigo);

  const consulta = useVerificacion(codigo);

  // El input sigue a la ruta (React reutiliza la instancia); ajuste durante el
  // render, no en un efecto.
  if (codigo !== codigoPrevio) {
    setCodigoPrevio(codigo);
    setEntrada(codigo ?? '');
  }

  const enviar = (evento: FormEvent) => {
    evento.preventDefault();
    const limpio = entrada.trim().toUpperCase();
    if (limpio) {
      navegar(`/recibos/verificar/${encodeURIComponent(limpio)}`);
    }
  };

  const leyenda = consulta.data ? LEYENDAS[consulta.data.estado] : null;

  return (
    <div className="mx-auto grid w-full max-w-2xl content-start gap-6">
      <div>
        <h1 className="text-2xl font-semibold">Verificar recibo</h1>
        <p className="mt-1 text-sm text-[var(--muted-foreground)]">
          Compruebe la autenticidad de un recibo con su código o el QR impreso.
        </p>
      </div>

      <Card>
        <CardContent className="pt-5">
          <form className="flex gap-2" onSubmit={enviar}>
            <Input
              value={entrada}
              onChange={(evento) => setEntrada(evento.target.value)}
              placeholder="RC-XXXXXXXXXXXX"
              aria-label="Código del recibo"
              data-testid="input-codigo"
            />
            <Button type="submit" data-testid="boton-verificar">
              <Search className="size-4" aria-hidden="true" /> Verificar
            </Button>
          </form>
        </CardContent>
      </Card>

      {consulta.isFetching && (
        <p role="status" className="text-sm">
          Consultando la cadena…
        </p>
      )}

      {consulta.isError && (
        <Card role="alert">
          <CardContent className="flex items-center gap-3 pt-5 text-sm">
            <ShieldX className="size-5 text-[var(--destructive)]" aria-hidden="true" />
            No fue posible verificar el recibo. Revise el código e intente nuevamente.
          </CardContent>
        </Card>
      )}

      {consulta.data && leyenda && (
        <Card data-testid="resultado-verificacion">
          <CardHeader>
            <div className="flex items-center gap-2">
              {consulta.data.estado === 'VALIDO' ? (
                <CheckCircle2 className="size-5 text-emerald-600" aria-hidden="true" />
              ) : consulta.data.estado === 'NO_ENCONTRADO' ? (
                <CircleHelp className="size-5 text-[var(--muted-foreground)]" aria-hidden="true" />
              ) : (
                <ShieldAlert className="size-5 text-amber-600" aria-hidden="true" />
              )}
              <CardTitle className="text-base">{leyenda.texto}</CardTitle>
              <Badge variant={leyenda.variante}>{consulta.data.estado}</Badge>
            </div>
            <CardDescription>{leyenda.detalle}</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-3 text-sm">
            <dl className="grid gap-3">
              <div>
                <dt className="text-[var(--muted-foreground)]">Código</dt>
                <dd className="font-mono text-xs">{consulta.data.codigo}</dd>
              </div>
              <div>
                <dt className="text-[var(--muted-foreground)]">hashRecibo (recalculado)</dt>
                <dd className="break-all font-mono text-xs" data-testid="hash-verificado">
                  {consulta.data.hashRecibo}
                </dd>
              </div>
              <div>
                <dt className="text-[var(--muted-foreground)]">hash en cadena</dt>
                <dd className="break-all font-mono text-xs">{consulta.data.hashOnchain ?? '—'}</dd>
              </div>
              <div>
                <dt className="text-[var(--muted-foreground)]">Anclado</dt>
                <dd>{formatearFecha(consulta.data.ancladoEn)}</dd>
              </div>
              <div>
                <dt className="text-[var(--muted-foreground)]">Transacción</dt>
                <dd className="break-all font-mono text-xs">{consulta.data.txHash ?? '—'}</dd>
              </div>
            </dl>
            {consulta.data.explorerUrl && (
              <a
                className="inline-flex items-center gap-1 text-sm text-[var(--primary)] underline"
                href={consulta.data.explorerUrl}
                target="_blank"
                rel="noreferrer"
              >
                Ver en el explorador <ExternalLink className="size-3" aria-hidden="true" />
              </a>
            )}
            <p className="text-xs text-[var(--muted-foreground)]">
              Verificado el {formatearFecha(consulta.data.verificadoEn)} · Red{' '}
              {consulta.data.chainId}
              {consulta.data.contractAddress ? ` · Contrato ${consulta.data.contractAddress}` : ''}
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
