import { SetMetadata } from '@nestjs/common';
import type { AccionAuditoria, EntidadAuditada } from '@oasis/shared';

export const AUDITAR_KEY = 'auditoria';

export interface MetadatoAuditoria {
  accion: AccionAuditoria;
  entidad: EntidadAuditada;
}

/** Registra la acción en la bitácora (HU-45) cuando el handler responde con éxito. */
export const Auditar = (accion: AccionAuditoria, entidad: EntidadAuditada) =>
  SetMetadata<string, MetadatoAuditoria>(AUDITAR_KEY, { accion, entidad });
