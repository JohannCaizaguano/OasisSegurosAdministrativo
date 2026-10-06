import type { AccionAuditoria } from '@oasis/shared';

import { periodoEnEcuador } from '../../domain/periodo-ecuador';
import type { NuevoRegistroAuditoria } from '../../domain/registro-auditoria';
import type { BitacoraRepositoryPort, PaginaBitacora } from '../ports/bitacora.repository.port';

export class RegistrarAccionUseCase {
  constructor(private readonly bitacora: BitacoraRepositoryPort) {}

  ejecutar(registro: NuevoRegistroAuditoria): Promise<void> {
    return this.bitacora.registrar(registro);
  }
}

export interface EntradaListarBitacora {
  pagina: number;
  porPagina: number;
  usuarioId?: string;
  accion?: AccionAuditoria;
  desde?: string;
  hasta?: string;
}

export class ListarBitacoraUseCase {
  constructor(private readonly bitacora: BitacoraRepositoryPort) {}

  ejecutar(entrada: EntradaListarBitacora): Promise<PaginaBitacora> {
    const periodo = periodoEnEcuador(entrada.desde, entrada.hasta);
    return this.bitacora.listar({
      usuarioId: entrada.usuarioId,
      accion: entrada.accion,
      desde: periodo.desde,
      hastaExclusivo: periodo.hastaExclusivo,
      pagina: entrada.pagina,
      porPagina: entrada.porPagina,
    });
  }
}

export class ListarUsuariosBitacoraUseCase {
  constructor(private readonly bitacora: BitacoraRepositoryPort) {}

  ejecutar() {
    return this.bitacora.listarUsuarios();
  }
}
