import { ConflictoError, ReglaNegocioError } from '../../../shared-kernel/domain-error';

/** El número repetido se reporta igual desde la comprobación previa y desde el índice único. */
export function numeroDuplicado(numero: string): ConflictoError {
  return new ConflictoError(`Ya existe una póliza con el número ${numero}`, {
    campo: 'numero',
    motivo: 'NUMERO_DUPLICADO',
  });
}

export function planNoCuadra(suma: string, prima: string): ReglaNegocioError {
  return new ReglaNegocioError(`Las cuotas suman ${suma} y la prima es ${prima} (RN-15)`, {
    campo: 'cuotas',
    motivo: 'PLAN_NO_CUADRA',
    suma,
    prima,
  });
}

export function planFueraDeVigencia(indice: number): ReglaNegocioError {
  return new ReglaNegocioError(`La cuota ${indice + 1} vence fuera de la vigencia de la póliza`, {
    campo: `cuotas.${indice}.fechaVencimiento`,
    motivo: 'PLAN_FUERA_DE_VIGENCIA',
  });
}

export function planConPagosValidados(): ReglaNegocioError {
  return new ReglaNegocioError('El plan no se puede cambiar: la póliza ya tiene pagos validados', {
    motivo: 'PLAN_CON_PAGOS_VALIDADOS',
  });
}

export function polizaNoVigente(mensaje: string): ReglaNegocioError {
  return new ReglaNegocioError(mensaje, { campo: 'estado', motivo: 'POLIZA_NO_VIGENTE' });
}
