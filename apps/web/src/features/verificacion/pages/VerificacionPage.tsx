import type { VerificacionPublica } from '@oasis/shared';
import { useQuery } from '@tanstack/react-query';
import { CheckCircle2, CircleHelp, ExternalLink, Search, ShieldAlert, ShieldX } from 'lucide-react';
import { useState, type FormEvent } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { api } from '@/lib/api-client';
import { formatearFecha } from '@/lib/format';

const LEYENDAS: Record<
  VerificacionPublica['estado'],
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

  const consulta = useQuery({
    queryKey: ['verificacion', codigo],
    queryFn: () => api.get<VerificacionPublica>(`/public/recibos/${codigo}/verificacion`),
    enabled: !!codigo,
    retry: false,
    staleTime: 0,
  });

  const enviar = (evento: FormEvent) => {
    evento.preventDefault();
    const limpio = entrada.trim().toUpperCase();
    if (limpio) {
      navegar(`/verificar/${limpio}`);
    }
  };

  const leyenda = consulta.data ? LEYENDAS[consulta.data.estado] : null;

  return (
    <div className="mx-auto grid min-h-screen max-w-2xl content-start gap-6 px-4 py-10">
      <div className="text-center">
        <h1 className="text-2xl font-semibold">Verificación pública de recibos</h1>
        <p className="mt-1 text-sm text-[var(--muted-foreground)]">
          Oasis Seguros · Compruebe la autenticidad de un recibo con su código o el QR impreso. No
          requiere iniciar sesión.
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
              <Search className="size-4" /> Verificar
            </Button>
          </form>
        </CardContent>
      </Card>

      {consulta.isFetching && <p className="text-center text-sm">Consultando la cadena…</p>}

      {consulta.isError && (
        <Card>
          <CardContent className="flex items-center gap-3 pt-5 text-sm">
            <ShieldX className="size-5 text-[var(--destructive)]" />
            No fue posible verificar el recibo. Revise el código e intente nuevamente.
          </CardContent>
        </Card>
      )}

      {consulta.data && leyenda && (
        <Card data-testid="resultado-verificacion">
          <CardHeader>
            <div className="flex items-center gap-2">
              {consulta.data.estado === 'VALIDO' ? (
                <CheckCircle2 className="size-5 text-emerald-600" />
              ) : consulta.data.estado === 'NO_ENCONTRADO' ? (
                <CircleHelp className="size-5 text-[var(--muted-foreground)]" />
              ) : (
                <ShieldAlert className="size-5 text-amber-600" />
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
                Ver en el explorador <ExternalLink className="size-3" />
              </a>
            )}
            <p className="text-xs text-[var(--muted-foreground)]">
              Verificado el {formatearFecha(consulta.data.verificadoEn)} · Red{' '}
              {consulta.data.chainId} · Contrato {consulta.data.contractAddress}
            </p>
          </CardContent>
        </Card>
      )}

      <p className="text-center text-xs text-[var(--muted-foreground)]">
        <Link className="underline" to="/login">
          Acceso para personal autorizado
        </Link>
      </p>
    </div>
  );
}
