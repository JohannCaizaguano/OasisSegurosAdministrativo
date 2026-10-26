import type { EstadoCuota } from '@oasis/shared';
import { aCentavos } from '@oasis/shared';

/**
 * Estado de una cuota según lo pagado y su vencimiento frente a `hoy` (Guayaquil). La misma
 * lectura que `aplicarPagoACuotas` y el cron (RN-14), para cuando se mueve la fecha (D13).
 */
export function estadoDeCuota(
  cuota: { valor: string; valorPagado: string; fechaVencimiento: string },
  hoy: string,
): EstadoCuota {
  const pagado = aCentavos(cuota.valorPagado);
  if (pagado >= aCentavos(cuota.valor)) return 'PAGADA';
  if (cuota.fechaVencimiento < hoy) return 'VENCIDA';
  return pagado > 0 ? 'PARCIAL' : 'PENDIENTE';
}
