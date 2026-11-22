import type { EstadoCuota } from '../constants/estados';
import { aCentavos, aMonto } from './cuotas';

export interface CuotaAplicable {
  id: string;
  numero: number;
  valor: string;
  valorPagado: string;
  fechaVencimiento: string;
  estado: EstadoCuota;
}

export interface AplicacionDePago {
  aplicaciones: { cuotaId: string; monto: string }[];
  cuotas: { id: string; valorPagado: string; estado: EstadoCuota }[];
}

/**
 * HU-36 (D11): reparte el monto entre las cuotas no PAGADAS por vencimiento y número, en
 * centavos. Una cuota cubierta en parte queda PARCIAL si aún no vence y VENCIDA si su fecha ya
 * pasó, por la fecha y no por el estado previo, para no depender de que el cron haya corrido.
 * `hoy` es la fecha `aaaa-mm-dd` de Guayaquil (`fechaEnGuayaquil`). Lanza `RangeError` si el
 * monto no es positivo o supera lo pendiente (RN-02).
 */
export function aplicarPagoACuotas(
  cuotas: readonly CuotaAplicable[],
  monto: string,
  hoy: string,
): AplicacionDePago {
  let restante = aCentavos(monto);
  if (restante <= 0) throw new RangeError('El monto del pago debe ser mayor que cero');
  const resultado: AplicacionDePago = { aplicaciones: [], cuotas: [] };
  const porAplicar = cuotas
    .filter((cuota) => cuota.estado !== 'PAGADA')
    .sort((a, b) => a.fechaVencimiento.localeCompare(b.fechaVencimiento) || a.numero - b.numero);
  for (const cuota of porAplicar) {
    if (restante === 0) break;
    const valor = aCentavos(cuota.valor);
    const aplicado = Math.min(restante, valor - aCentavos(cuota.valorPagado));
    if (aplicado <= 0) continue;
    restante -= aplicado;
    const pagado = aCentavos(cuota.valorPagado) + aplicado;
    const estado: EstadoCuota =
      pagado === valor ? 'PAGADA' : cuota.fechaVencimiento < hoy ? 'VENCIDA' : 'PARCIAL';
    resultado.aplicaciones.push({ cuotaId: cuota.id, monto: aMonto(aplicado) });
    resultado.cuotas.push({ id: cuota.id, valorPagado: aMonto(pagado), estado });
  }
  if (restante > 0) throw new RangeError('El monto supera lo pendiente de las cuotas');
  return resultado;
}
