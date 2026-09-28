import { ArrowLeft, ExternalLink } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { Link, useParams } from 'react-router-dom';

import { AvisoError } from '@/components/data-state';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { acortarHash, formatearFecha } from '@/lib/format';

import { useRecibo } from '../hooks';

export function ReciboDetallePage() {
  const { id } = useParams<{ id: string }>();
  const consulta = useRecibo(id);
  const recibo = consulta.data;

  if (consulta.isLoading) {
    return (
      <div className="grid gap-4">
        <Skeleton className="h-8 w-56" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  // Sin esta rama, un 404 o un 500 dejaban el esqueleto girando para siempre:
  // `!recibo` también es cierto cuando la consulta falló.
  if (consulta.isError || !recibo) {
    return (
      <div className="grid gap-4">
        <Button asChild variant="ghost" size="sm" className="justify-start">
          <Link to="/recibos">
            <ArrowLeft className="size-4" /> Recibos
          </Link>
        </Button>
        <AvisoError error={consulta.error} alReintentar={() => void consulta.refetch()} />
      </div>
    );
  }

  const urlPublica = `${window.location.origin}/verificar/${recibo.codigo}`;

  return (
    <div className="grid gap-4">
      <div className="flex items-center gap-3">
        <Button asChild variant="ghost" size="sm">
          <Link to="/recibos">
            <ArrowLeft className="size-4" /> Recibos
          </Link>
        </Button>
        <h1 className="text-2xl font-semibold">Recibo {recibo.codigo}</h1>
        <Badge
          variant={recibo.estado === 'ANCLADO' ? 'success' : 'warning'}
          data-testid="estado-recibo"
        >
          {recibo.estado}
        </Badge>
      </div>

      <div className="grid gap-4 lg:grid-cols-[2fr_1fr]">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Datos del recibo</CardTitle>
            <CardDescription>
              Anclado en la red {recibo.chainId === 31337 ? 'Hardhat local' : 'Polygon Amoy'}
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4 text-sm">
            <dl className="grid gap-3 sm:grid-cols-2">
              <div>
                <dt className="text-[var(--muted-foreground)]">Póliza</dt>
                <dd className="font-medium">{recibo.numeroPoliza}</dd>
              </div>
              <div>
                <dt className="text-[var(--muted-foreground)]">Pago (id)</dt>
                <dd className="font-mono text-xs">{recibo.pagoId}</dd>
              </div>
              <div>
                <dt className="text-[var(--muted-foreground)]">Emitido</dt>
                <dd>{formatearFecha(recibo.creadoEn)}</dd>
              </div>
              <div>
                <dt className="text-[var(--muted-foreground)]">Anclado</dt>
                <dd data-testid="fecha-anclado">{formatearFecha(recibo.ancladoEn)}</dd>
              </div>
              <div className="sm:col-span-2">
                <dt className="text-[var(--muted-foreground)]">idOnchain</dt>
                <dd className="break-all font-mono text-xs">{recibo.idOnchain}</dd>
              </div>
              <div className="sm:col-span-2">
                <dt className="text-[var(--muted-foreground)]">hashRecibo (keccak256 con sal)</dt>
                <dd className="break-all font-mono text-xs" data-testid="hash-recibo">
                  {recibo.hashRecibo}
                </dd>
              </div>
              <div className="sm:col-span-2">
                <dt className="text-[var(--muted-foreground)]">Transacción</dt>
                <dd className="break-all font-mono text-xs">{recibo.txHash ?? 'pendiente'}</dd>
              </div>
              <div>
                <dt className="text-[var(--muted-foreground)]">Bloque</dt>
                <dd>{recibo.blockNumber ?? '—'}</dd>
              </div>
              <div>
                <dt className="text-[var(--muted-foreground)]">Gas usado</dt>
                <dd>{recibo.gasUsed ?? '—'}</dd>
              </div>
            </dl>

            {recibo.explorerUrl && (
              <a
                className="inline-flex items-center gap-1 text-sm text-[var(--primary)] underline"
                href={recibo.explorerUrl}
                target="_blank"
                rel="noreferrer"
              >
                Ver transacción en el explorador <ExternalLink className="size-3" />
              </a>
            )}
            {recibo.ultimoError && (
              <p className="rounded-md bg-[var(--destructive)]/10 p-3 text-xs text-[var(--destructive)]">
                Último error ({recibo.intentos} intentos): {recibo.ultimoError}
              </p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Verificación pública</CardTitle>
            <CardDescription>
              Cualquier persona puede comprobar este recibo sin iniciar sesión.
            </CardDescription>
          </CardHeader>
          <CardContent className="grid justify-items-center gap-4">
            <div className="rounded-xl bg-white p-3" data-testid="qr-recibo">
              <QRCodeSVG value={urlPublica} size={180} title={`Verificación de ${recibo.codigo}`} />
            </div>
            <p className="break-all text-center font-mono text-xs text-[var(--muted-foreground)]">
              {urlPublica}
            </p>
            <Button asChild className="w-full">
              <Link to={`/verificar/${recibo.codigo}`} data-testid="enlace-verificacion">
                Abrir verificación pública
              </Link>
            </Button>
            <p className="text-center text-xs text-[var(--muted-foreground)]">
              Hash: {acortarHash(recibo.hashRecibo)}
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
