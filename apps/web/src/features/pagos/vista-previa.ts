import {
  aCentavos,
  aMonto,
  aplicarPagoACuotas,
  montoDecimalSchema,
  type Cuota,
} from '@oasis/shared';

import { ESTADOS } from '@/components/estados';
import { formatearMoneda } from '@/lib/format';

export type VistaPrevia =
  | { tipo: 'aplicacion'; frase: string; fraseCondicional: string }
  | { tipo: 'supera-saldo'; pendiente: string };

function enumerar(partes: string[]): string {
  return partes.length > 1
    ? `${partes.slice(0, -1).join(', ')} y ${partes[partes.length - 1]}`
    : (partes[0] ?? '');
}

function pendienteDe(cuotas: readonly Cuota[]): string {
  return aMonto(
    cuotas
      .filter((cuota) => cuota.estado !== 'PAGADA')
      .reduce((total, cuota) => total + aCentavos(cuota.valor) - aCentavos(cuota.valorPagado), 0),
  );
}

/**
 * D24: anticipa con la misma regla del API (`aplicarPagoACuotas`) qué cuotas cubriría el pago.
 * `null` si el monto aún no es válido.
 */
export function vistaPreviaAplicacion(
  cuotas: readonly Cuota[],
  monto: string,
  hoy: string,
): VistaPrevia | null {
  if (!montoDecimalSchema.safeParse(monto).success || aCentavos(monto) <= 0) {
    return null;
  }
  let resultado: ReturnType<typeof aplicarPagoACuotas>;
  try {
    resultado = aplicarPagoACuotas(cuotas, monto, hoy);
  } catch (error) {
    if (error instanceof RangeError) {
      return { tipo: 'supera-saldo', pendiente: pendienteDe(cuotas) };
    }
    throw error;
  }

  const numero = new Map(cuotas.map((cuota) => [cuota.id, cuota.numero]));
  const indicativo: string[] = [];
  const condicional: string[] = [];
  resultado.cuotas.forEach(({ id, estado }, indice) => {
    const nombre = `la cuota ${numero.get(id) ?? '?'}`;
    if (estado === 'PAGADA') {
      indicativo.push(`${nombre} queda Pagada`);
      condicional.push(`${nombre} quedaría Pagada`);
      return;
    }
    const monto = formatearMoneda(resultado.aplicaciones[indice]?.monto ?? '0');
    const efecto =
      estado === 'VENCIDA' ? `sigue ${ESTADOS.cuota.VENCIDA.texto}` : ESTADOS.cuota.PARCIAL.texto;
    indicativo.push(`${nombre} recibe ${monto} (${efecto})`);
    condicional.push(`${nombre} recibiría ${monto} (${efecto})`);
  });
  return {
    tipo: 'aplicacion',
    frase: enumerar(indicativo),
    fraseCondicional: enumerar(condicional),
  };
}
