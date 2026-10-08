import { ConflictoError } from '../../../shared-kernel/domain-error';

/** El número repetido se reporta igual desde la comprobación previa y desde el índice único. */
export function numeroDuplicado(numero: string): ConflictoError {
  return new ConflictoError(`Ya existe una póliza con el número ${numero}`, {
    campo: 'numero',
    motivo: 'NUMERO_DUPLICADO',
  });
}
