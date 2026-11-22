import { ETIQUETAS_METODO_PAGO, type ReciboImprimible as Recibo } from '@oasis/shared';
import { QRCodeSVG } from 'qrcode.react';
import type { ReactNode } from 'react';

import isologo from '@/assets/isologo-oasis.png';
import { EstadoInsignia } from '@/components/EstadoInsignia';
import { formatearFecha, formatearMoneda } from '@/lib/format';

function Dato({ termino, children }: { termino: string; children: ReactNode }) {
  return (
    <div className="grid gap-0.5">
      <dt className="text-caption text-muted-foreground">{termino}</dt>
      <dd className="font-semibold break-words">{children}</dd>
    </div>
  );
}

function Seccion({ titulo, children }: { titulo: string; children: ReactNode }) {
  return (
    <section className="grid gap-3 border-t border-border pt-4">
      <h2 className="text-tabla font-semibold tracking-[0.06em] text-muted-foreground uppercase">
        {titulo}
      </h2>
      <dl className="grid gap-x-6 gap-y-3 sm:grid-cols-2">{children}</dl>
    </section>
  );
}

/** Hoja del recibo para imprimir o guardar como PDF (HU-25, D7 y D8): sin sal ni datos internos. */
export function ReciboImprimible({ recibo }: { recibo: Recibo }) {
  const urlVerificacion = `${window.location.origin}/recibos/verificar/${recibo.codigo}`;

  return (
    <article
      aria-labelledby="titulo-recibo"
      className="recibo-imprimible mx-auto grid w-full max-w-[720px] gap-5 rounded-lg bg-card p-5 shadow-sm sm:p-8"
    >
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          <img src={isologo} alt="Oasis Seguros" width={56} height={56} className="size-14" />
          <div className="grid gap-0.5">
            <h1 id="titulo-recibo" className="text-title font-bold">
              Recibo de pago
            </h1>
            <p className="text-caption text-muted-foreground">Oasis Seguros · bróker de seguros</p>
          </div>
        </div>
        <EstadoInsignia dominio="recibo" estado={recibo.estadoAnclaje} />
      </header>

      <div className="grid gap-1">
        <p className="text-caption text-muted-foreground">Código del recibo</p>
        <p className="cifra text-headline-movil font-bold break-all sm:text-cifra">
          {recibo.codigo}
        </p>
      </div>

      <Seccion titulo="Pago">
        <Dato termino="Monto">
          <span className="cifra text-title">{formatearMoneda(recibo.pago.monto)}</span>
        </Dato>
        <Dato termino="Fecha de pago">
          <span className="cifra">{formatearFecha(recibo.pago.fechaPago)}</span>
        </Dato>
        <Dato termino="Método">{ETIQUETAS_METODO_PAGO[recibo.pago.metodo]}</Dato>
        <Dato termino="Referencia">{recibo.pago.referencia ?? '—'}</Dato>
      </Seccion>

      <Seccion titulo="Póliza">
        <Dato termino="Número">
          <span className="cifra">{recibo.poliza.numero}</span>
        </Dato>
        <Dato termino="Ramo">{recibo.poliza.ramo}</Dato>
        <Dato termino="Aseguradora">{recibo.poliza.aseguradora}</Dato>
      </Seccion>

      <Seccion titulo="Cliente">
        <Dato termino="Nombre">{recibo.cliente.nombre}</Dato>
        <Dato termino="Identificación">
          <span className="cifra">{recibo.cliente.identificacionEnmascarada}</span>
        </Dato>
      </Seccion>

      <Seccion titulo="Emisión">
        <Dato termino="Emitido">
          <span className="cifra">{formatearFecha(recibo.emitidoEn)}</span>
        </Dato>
        <Dato termino="Verificable desde">
          <span className="cifra">{formatearFecha(recibo.ancladoEn)}</span>
        </Dato>
      </Seccion>

      <footer className="grid justify-items-center gap-2 border-t border-border pt-5 text-center">
        <QRCodeSVG
          value={urlVerificacion}
          title={`Código QR para verificar el recibo ${recibo.codigo}`}
          className="size-[32mm]"
        />
        <p className="cifra font-semibold">{recibo.codigo}</p>
        <p className="text-caption text-muted-foreground">
          Verifique este recibo en Oasis Seguros con su sesión
        </p>
      </footer>
    </article>
  );
}
