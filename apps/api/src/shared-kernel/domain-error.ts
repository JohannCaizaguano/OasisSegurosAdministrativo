export type CodigoErrorDominio =
  | 'VALIDACION'
  | 'NO_ENCONTRADO'
  | 'CONFLICTO'
  | 'NO_AUTORIZADO'
  | 'PROHIBIDO'
  | 'REGLA_NEGOCIO'
  | 'DEPENDENCIA_EXTERNA'
  | 'DEMASIADAS_CONSULTAS';

export abstract class DomainError extends Error {
  abstract readonly codigo: CodigoErrorDominio;

  constructor(
    message: string,
    readonly detalles?: unknown,
  ) {
    super(message);
    this.name = new.target.name;
  }
}

export class ValidacionError extends DomainError {
  readonly codigo = 'VALIDACION' as const;
}

export class NoEncontradoError extends DomainError {
  readonly codigo = 'NO_ENCONTRADO' as const;

  constructor(recurso: string, id?: string) {
    super(`${recurso} no encontrado${id ? `: ${id}` : ''}`);
  }
}

export class ConflictoError extends DomainError {
  readonly codigo = 'CONFLICTO' as const;
}

export class NoAutorizadoError extends DomainError {
  readonly codigo = 'NO_AUTORIZADO' as const;
}

export class ProhibidoError extends DomainError {
  readonly codigo = 'PROHIBIDO' as const;
}

export class ReglaNegocioError extends DomainError {
  readonly codigo = 'REGLA_NEGOCIO' as const;
}

export class ErrorDependenciaExterna extends DomainError {
  readonly codigo = 'DEPENDENCIA_EXTERNA' as const;
}

/** Límite de consultas por usuario superado (D4); `reintentarEnSegundos` va en `Retry-After`. */
export class DemasiadasConsultasError extends DomainError {
  readonly codigo = 'DEMASIADAS_CONSULTAS' as const;

  constructor(readonly reintentarEnSegundos: number) {
    super('Demasiadas consultas. Espere un minuto e intente de nuevo.', {
      motivo: 'DEMASIADAS_CONSULTAS',
      reintentarEnSegundos,
    });
  }
}
