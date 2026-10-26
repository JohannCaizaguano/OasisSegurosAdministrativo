import type { VerificacionRecibo } from '@oasis/shared';
import { ChevronDown, ExternalLink, Search, ShieldX } from 'lucide-react';
import { useState, type FormEvent } from 'react';
import { useNavigate, useParams } from 'react-router-dom';

import { EstadoInsignia } from '@/components/EstadoInsignia';
import { CLASES_TONO, presentacionDe } from '@/components/estados';
import { Encabezado } from '@/components/layout/Encabezado';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ApiError } from '@/lib/api-client';
import { useAuthStore } from '@/lib/auth-store';
import { formatearFecha } from '@/lib/format';

import { useVerificacion } from '../hooks';

const TITULOS: Record<VerificacionRecibo['estado'], string> = {
  AUTENTICO: 'Recibo auténtico',
  NO_COINCIDE: 'El recibo no coincide',
  EN_PROCESO: 'Recibo en proceso',
  ANULADO: 'Recibo anulado',
  NO_ENCONTRADO: 'Recibo no encontrado',
};

function DatoTecnico({
  termino,
  children,
  testId,
}: {
  termino: string;
  children: string;
  testId?: string;
}) {
  return (
    <div>
      <dt className="text-caption text-muted-foreground">{termino}</dt>
      <dd className="font-mono text-caption break-all" data-testid={testId}>
        {children}
      </dd>
    </div>
  );
}

/** D5: hashes, contrato y bloque solo para el personal, plegados por defecto. */
function DetallesTecnicos({ verificacion }: { verificacion: VerificacionRecibo }) {
  return (
    <details className="group rounded-md bg-secondary px-4">
      <summary className="flex min-h-control cursor-pointer items-center gap-2 font-semibold text-link">
        <ChevronDown
          className="size-4 transition-transform group-open:rotate-180"
          aria-hidden="true"
        />
        Detalles técnicos
      </summary>
      <dl className="grid gap-3.5 pb-4">
        <DatoTecnico termino="hashRecibo (recalculado)" testId="hash-verificado">
          {verificacion.hashRecibo}
        </DatoTecnico>
        <DatoTecnico termino="hash en el contrato">{verificacion.hashOnchain ?? '—'}</DatoTecnico>
        <DatoTecnico termino="Transacción">{verificacion.txHash ?? '—'}</DatoTecnico>
        <DatoTecnico termino="Bloque">{verificacion.blockNumber ?? '—'}</DatoTecnico>
        <DatoTecnico termino="Contrato">{verificacion.contractAddress ?? '—'}</DatoTecnico>
        <DatoTecnico termino="Red (chainId)">{String(verificacion.chainId)}</DatoTecnico>
      </dl>
    </details>
  );
}

function Resultado({
  verificacion,
  esPersonal,
}: {
  verificacion: VerificacionRecibo;
  esPersonal: boolean;
}) {
  const { tono, icono: Icono, descripcion } = presentacionDe('verificacion', verificacion.estado);

  return (
    <Card
      data-testid="resultado-verificacion"
      data-estado={verificacion.estado}
      className="animate-aviso"
    >
      <CardContent className="grid gap-5 pt-5">
        <div className="flex items-start gap-4">
          <span
            className={`grid size-14 shrink-0 place-items-center rounded-full ${CLASES_TONO[tono]}`}
          >
            <Icono className="size-7" aria-hidden="true" />
          </span>
          <div className="grid min-w-0 gap-1.5">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-title font-bold">{TITULOS[verificacion.estado]}</h2>
              <EstadoInsignia dominio="verificacion" estado={verificacion.estado} />
            </div>
            <p className="text-muted-foreground">{descripcion}</p>
          </div>
        </div>

        <dl className="grid gap-x-6 gap-y-3.5 sm:grid-cols-2">
          <div>
            <dt className="text-caption text-muted-foreground">Código</dt>
            <dd className="cifra font-semibold">{verificacion.codigo}</dd>
          </div>
          <div>
            <dt className="text-caption text-muted-foreground">Registrado</dt>
            <dd className="cifra font-semibold">{formatearFecha(verificacion.ancladoEn)}</dd>
          </div>
        </dl>

        {verificacion.explorerUrl ? (
          <a
            className="inline-flex min-h-control items-center gap-1.5 self-start font-semibold text-link underline underline-offset-3"
            href={verificacion.explorerUrl}
            target="_blank"
            rel="noopener noreferrer"
          >
            {esPersonal ? 'Ver en el explorador' : 'Ver el registro público'}
            <ExternalLink className="size-4" aria-hidden="true" />
            <span className="sr-only">(se abre en una pestaña nueva)</span>
          </a>
        ) : null}

        {esPersonal ? <DetallesTecnicos verificacion={verificacion} /> : null}

        <p className="text-caption text-muted-foreground">
          Verificado el <span className="cifra">{formatearFecha(verificacion.verificadoEn)}</span>
        </p>
      </CardContent>
    </Card>
  );
}

/** El 429 del límite por usuario (D4) trae los segundos de espera en `details`. */
function mensajeDeError(error: unknown): string {
  if (error instanceof ApiError && error.statusCode === 429) {
    const detalles = error.details as { reintentarEnSegundos?: unknown } | undefined;
    const segundos = detalles?.reintentarEnSegundos;
    return typeof segundos === 'number'
      ? `Demasiadas consultas; intente de nuevo en ${segundos} segundos.`
      : 'Demasiadas consultas; intente de nuevo en un minuto.';
  }
  return 'No fue posible verificar el recibo. Revise el código e intente nuevamente.';
}

export function VerificacionPage() {
  const { codigo } = useParams<{ codigo: string }>();
  const navegar = useNavigate();
  const [entrada, setEntrada] = useState(codigo ?? '');
  const [codigoPrevio, setCodigoPrevio] = useState(codigo);

  const consulta = useVerificacion(codigo);
  const esPersonal = useAuthStore((estado) => estado.usuario?.rol !== 'CLIENTE');

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

  return (
    <div className="mx-auto grid w-full max-w-2xl content-start gap-5">
      <Encabezado
        titulo="Verificar recibo"
        descripcion="Compruebe la autenticidad de un recibo con su código o el QR impreso."
      />

      <Card>
        <CardContent className="pt-5">
          <form className="grid gap-1.5" onSubmit={enviar}>
            <Label htmlFor="codigo-recibo">Código del recibo</Label>
            <div className="flex flex-wrap gap-2.5">
              <Input
                id="codigo-recibo"
                value={entrada}
                onChange={(evento) => setEntrada(evento.target.value)}
                placeholder="RC-XXXXXXXXXXXX"
                autoComplete="off"
                spellCheck={false}
                className="flex-[1_1_220px] uppercase placeholder:normal-case"
                data-testid="input-codigo"
              />
              <Button type="submit" className="min-h-input" data-testid="boton-verificar">
                <Search aria-hidden="true" /> Verificar
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {consulta.isFetching && (
        <p role="status" className="text-muted-foreground">
          Verificando el recibo…
        </p>
      )}

      {consulta.isError && (
        <p
          role="alert"
          className="flex animate-aviso items-start gap-2.5 rounded-md bg-estado-error-fondo px-4 py-3 font-medium text-estado-error"
        >
          <ShieldX className="mt-0.5 size-5 shrink-0" aria-hidden="true" />
          {mensajeDeError(consulta.error)}
        </p>
      )}

      {consulta.data && <Resultado verificacion={consulta.data} esPersonal={esPersonal} />}
    </div>
  );
}
