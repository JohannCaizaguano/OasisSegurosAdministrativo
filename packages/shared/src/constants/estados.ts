export const TIPOS_IDENTIFICACION = ['CEDULA', 'RUC', 'PASAPORTE'] as const;
export type TipoIdentificacion = (typeof TIPOS_IDENTIFICACION)[number];

export const ESTADOS_POLIZA = ['VIGENTE', 'VENCIDA', 'CANCELADA'] as const;
export type EstadoPoliza = (typeof ESTADOS_POLIZA)[number];

export const ESTADOS_CUOTA = ['PENDIENTE', 'PARCIAL', 'PAGADA', 'VENCIDA'] as const;
export type EstadoCuota = (typeof ESTADOS_CUOTA)[number];

/** HU-38 (D16): TODAS reúne POR_VENCER y VENCIDAS; las cuotas PAGADAS nunca están en cartera. */
export const VISTAS_CARTERA = ['POR_VENCER', 'VENCIDAS', 'TODAS'] as const;
export type VistaCartera = (typeof VISTAS_CARTERA)[number];

export const FILTROS_ESTADO_CLIENTE = ['ACTIVOS', 'INACTIVOS', 'TODOS'] as const;
export type FiltroEstadoCliente = (typeof FILTROS_ESTADO_CLIENTE)[number];

export const METODOS_PAGO = [
  'DEBITO_BANCARIO',
  'TRANSFERENCIA',
  'DEPOSITO',
  'EFECTIVO',
  'TARJETA',
] as const;
export type MetodoPago = (typeof METODOS_PAGO)[number];

export const ETIQUETAS_METODO_PAGO: Record<MetodoPago, string> = {
  DEBITO_BANCARIO: 'Débito bancario',
  TRANSFERENCIA: 'Transferencia',
  DEPOSITO: 'Depósito',
  EFECTIVO: 'Efectivo',
  TARJETA: 'Tarjeta',
};

/** Chips del diálogo de rechazo (D10): rellenan el motivo, que sigue siendo editable. */
export const MOTIVOS_RECHAZO_FRECUENTES = [
  'El monto no coincide con la notificación',
  'La referencia no corresponde',
  'Pago duplicado',
  'La póliza no corresponde',
] as const;

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

/** HU-28 (D2): resultados de verificar un recibo, 1:1 con el criterio de aceptación. */
export const ESTADOS_VERIFICACION = [
  'AUTENTICO',
  'NO_COINCIDE',
  'EN_PROCESO',
  'ANULADO',
  'NO_ENCONTRADO',
] as const;
export type EstadoVerificacion = (typeof ESTADOS_VERIFICACION)[number];
