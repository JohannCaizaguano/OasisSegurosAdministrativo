export const TIPOS_IDENTIFICACION = ['CEDULA', 'RUC', 'PASAPORTE'] as const;
export type TipoIdentificacion = (typeof TIPOS_IDENTIFICACION)[number];

export const ESTADOS_POLIZA = ['VIGENTE', 'VENCIDA', 'CANCELADA'] as const;
export type EstadoPoliza = (typeof ESTADOS_POLIZA)[number];

export const METODOS_PAGO = ['TRANSFERENCIA', 'DEPOSITO', 'EFECTIVO', 'TARJETA'] as const;
export type MetodoPago = (typeof METODOS_PAGO)[number];

export const ESTADOS_PAGO = ['REGISTRADO', 'VALIDADO', 'RECHAZADO'] as const;
export type EstadoPago = (typeof ESTADOS_PAGO)[number];

export const ESTADOS_RECIBO = [
  'PENDIENTE_ANCLAJE',
  'ENVIADO',
  'ANCLADO',
  'FALLIDO',
  'ANULADO',
] as const;
export type EstadoRecibo = (typeof ESTADOS_RECIBO)[number];

export const ESTADOS_RECIBO_FINALES: readonly EstadoRecibo[] = ['ANCLADO', 'FALLIDO', 'ANULADO'];

export const MONEDA = 'USD' as const;

export const ESTADOS_VERIFICACION = [
  'VALIDO',
  'ANULADO',
  'NO_ANCLADO',
  'NO_ENCONTRADO',
  'HASH_INCONSISTENTE',
] as const;
export type EstadoVerificacion = (typeof ESTADOS_VERIFICACION)[number];
