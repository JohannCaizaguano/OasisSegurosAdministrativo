import type { AccionAuditoria, EntidadAuditada } from '@oasis/shared';

/** Metadatos técnicos de la petición; nunca valores de datos personales (ADR-013). */
export type DetalleAuditoria = {
  metodo: string;
  ruta: string;
  requestId: string | null;
  campos?: string[];
  /** D12: estado nuevo de la póliza, para poder encontrarlo en la bitácora. */
  estado?: string;
};

export interface NuevoRegistroAuditoria {
  usuarioId: string;
  accion: AccionAuditoria;
  entidad: EntidadAuditada;
  entidadId: string | null;
  ip: string | null;
  detalle: DetalleAuditoria;
}

export interface RegistroAuditoria {
  id: string;
  usuarioId: string;
  usuarioEmail: string;
  accion: string;
  entidad: string;
  entidadId: string | null;
  ip: string | null;
  detalle: Record<string, unknown> | null;
  creadoEn: string;
}

/** En MODIFICAR guarda solo los nombres de los campos enviados, nunca sus valores. */
export function construirDetalle(
  accion: AccionAuditoria,
  peticion: { metodo: string; ruta: string; requestId: string | null; cuerpo: unknown },
): DetalleAuditoria {
  const detalle: DetalleAuditoria = {
    metodo: peticion.metodo,
    ruta: peticion.ruta,
    requestId: peticion.requestId,
  };
  const cuerpo =
    typeof peticion.cuerpo === 'object' && peticion.cuerpo !== null
      ? (peticion.cuerpo as Record<string, unknown>)
      : null;

  if (accion === 'MODIFICAR' && cuerpo) {
    const campos = Object.keys(cuerpo).sort();
    if (campos.length > 0) {
      detalle.campos = campos;
    }
  }

  if (accion === 'CAMBIAR_ESTADO' && typeof cuerpo?.estado === 'string') {
    detalle.estado = cuerpo.estado;
  }
  return detalle;
}
