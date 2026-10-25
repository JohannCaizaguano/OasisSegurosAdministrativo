import type { VerificacionRecibo } from '@oasis/shared';
import { ExternalLink, Search, ShieldX } from 'lucide-react';
import { useState, type FormEvent } from 'react';
import { useNavigate, useParams } from 'react-router-dom';

import { EstadoInsignia } from '@/components/EstadoInsignia';
import { CLASES_TONO, presentacionDe } from '@/components/estados';
import { Encabezado } from '@/components/layout/Encabezado';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { formatearFecha } from '@/lib/format';

import { useVerificacion } from '../hooks';

const TITULOS: Record<VerificacionRecibo['estado'], string> = {
  VALIDO: 'Recibo auténtico',
  ANULADO: 'Recibo anulado',
  NO_ANCLADO: 'Recibo en proceso',
  NO_ENCONTRADO: 'Recibo no encontrado',
  HASH_INCONSISTENTE: 'El recibo no coincide',
};

function Dato({
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

function Resultado({ verificacion }: { verificacion: VerificacionRecibo }) {
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

        <dl className="grid gap-3.5">
          <div>
            <dt className="text-caption text-muted-foreground">Código</dt>
            <dd className="cifra font-semibold">{verificacion.codigo}</dd>
          </div>
          <Dato termino="hashRecibo (recalculado)" testId="hash-verificado">
            {verificacion.hashRecibo}
          </Dato>
          <Dato termino="hash en cadena">{verificacion.hashOnchain ?? '—'}</Dato>
          <div>
            <dt className="text-caption text-muted-foreground">Anclado</dt>
            <dd className="font-semibold">{formatearFecha(verificacion.ancladoEn)}</dd>
          </div>
          <Dato termino="Transacción">{verificacion.txHash ?? '—'}</Dato>
        </dl>

        {verificacion.explorerUrl && (
          <a
            className="inline-flex min-h-control items-center gap-1.5 self-start font-semibold text-link underline underline-offset-3"
            href={verificacion.explorerUrl}
            target="_blank"
            rel="noreferrer"
          >
            Ver en el explorador
            <ExternalLink className="size-4" aria-hidden="true" />
            <span className="sr-only">(se abre en una pestaña nueva)</span>
          </a>
        )}
        <p className="text-caption text-muted-foreground">
          Verificado el {formatearFecha(verificacion.verificadoEn)} · Red {verificacion.chainId}
          {verificacion.contractAddress ? (
            <>
              {' · Contrato '}
              <span className="font-mono break-all">{verificacion.contractAddress}</span>
            </>
          ) : null}
        </p>
      </CardContent>
    </Card>
  );
}

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
          No fue posible verificar el recibo. Revise el código e intente nuevamente.
        </p>
      )}

      {consulta.data && <Resultado verificacion={consulta.data} />}
    </div>
  );
}
