import canonicalize from 'canonicalize';

import { ValidacionError } from '../../../shared-kernel/domain-error';

/**
 * Payload canónico (RFC 8785) del recibo. NUNCA incluye datos personales.
 * El orden de las claves es relevante para la reproducibilidad del hash.
 */
export interface PayloadRecibo {
  codigo: string;
  pagoId: string;
  numeroPoliza: string;
  monto: string;
  moneda: 'USD';
  fechaPago: string;
  emitidoEn: string;
}

export function serializarCanonico(payload: PayloadRecibo): string {
  const canonico = canonicalize(payload);
  if (typeof canonico !== 'string') {
    throw new ValidacionError('No fue posible serializar el payload canónico del recibo');
  }
  return canonico;
}
