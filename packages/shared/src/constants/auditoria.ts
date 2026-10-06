export const ACCIONES_AUDITORIA = [
  'CREAR',
  'MODIFICAR',
  'ELIMINAR',
  'VALIDAR',
  'RECHAZAR',
  'ANULAR',
  'REINTENTAR',
  'INICIAR_SESION',
  'IMPORTAR',
] as const;
export type AccionAuditoria = (typeof ACCIONES_AUDITORIA)[number];

/** Nombres de los modelos de Prisma que afectan las acciones auditadas. */
export const ENTIDADES_AUDITADAS = [
  'Usuario',
  'Cliente',
  'Aseguradora',
  'Poliza',
  'Pago',
  'Recibo',
] as const;
export type EntidadAuditada = (typeof ENTIDADES_AUDITADAS)[number];
