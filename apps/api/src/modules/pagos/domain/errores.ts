import { ReglaNegocioError } from '../../../shared-kernel/domain-error';

/** RN-02: el mismo error al registrar, al validar y con las cuotas bloqueadas (D12). */
export function montoSuperaSaldo(saldo: string): ReglaNegocioError {
  return new ReglaNegocioError('El monto supera el saldo pendiente de la póliza (RN-02)', {
    campo: 'monto',
    motivo: 'MONTO_SUPERA_SALDO',
    saldo,
  });
}
