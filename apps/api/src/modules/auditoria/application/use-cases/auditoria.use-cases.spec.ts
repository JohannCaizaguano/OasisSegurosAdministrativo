import type {
  BitacoraRepositoryPort,
  FiltrosBitacora,
  PaginaBitacora,
} from '../ports/bitacora.repository.port';
import type { NuevoRegistroAuditoria } from '../../domain/registro-auditoria';
import { ListarBitacoraUseCase, RegistrarAccionUseCase } from './auditoria.use-cases';

const USUARIO_ID = '11111111-1111-1111-1111-111111111111';

const REGISTRO: NuevoRegistroAuditoria = {
  usuarioId: USUARIO_ID,
  accion: 'CREAR',
  entidad: 'Cliente',
  entidadId: '22222222-2222-2222-2222-222222222222',
  ip: '127.0.0.1',
  detalle: { metodo: 'POST', ruta: '/api/v1/clientes', requestId: null },
};

class BitacoraEspia implements BitacoraRepositoryPort {
  readonly registros: NuevoRegistroAuditoria[] = [];
  readonly consultas: FiltrosBitacora[] = [];
  resultado: PaginaBitacora = { items: [], total: 0 };
  usuarios: Array<{ id: string; email: string }> = [];

  async registrar(registro: NuevoRegistroAuditoria): Promise<void> {
    this.registros.push(registro);
  }

  async listar(filtros: FiltrosBitacora): Promise<PaginaBitacora> {
    this.consultas.push(filtros);
    return this.resultado;
  }

  async listarUsuarios(): Promise<Array<{ id: string; email: string }>> {
    return this.usuarios;
  }
}

describe('RegistrarAccionUseCase', () => {
  it('delega el registro en el repositorio', async () => {
    const espia = new BitacoraEspia();
    const caso = new RegistrarAccionUseCase(espia);

    await caso.ejecutar(REGISTRO);

    expect(espia.registros).toEqual([REGISTRO]);
  });
});

describe('ListarBitacoraUseCase', () => {
  it('pasa filtros, paginación y el periodo convertido a hora de Ecuador', async () => {
    const espia = new BitacoraEspia();
    const caso = new ListarBitacoraUseCase(espia);

    await caso.ejecutar({
      pagina: 2,
      porPagina: 20,
      usuarioId: USUARIO_ID,
      accion: 'CREAR',
      desde: '2026-10-01',
      hasta: '2026-10-01',
    });

    expect(espia.consultas).toEqual([
      {
        usuarioId: USUARIO_ID,
        accion: 'CREAR',
        desde: new Date('2026-10-01T05:00:00.000Z'),
        hastaExclusivo: new Date('2026-10-02T05:00:00.000Z'),
        pagina: 2,
        porPagina: 20,
      },
    ]);
  });

  it('sin fechas no envía límites temporales', async () => {
    const espia = new BitacoraEspia();
    const caso = new ListarBitacoraUseCase(espia);

    await caso.ejecutar({ pagina: 1, porPagina: 20 });

    expect(espia.consultas[0].desde).toBeUndefined();
    expect(espia.consultas[0].hastaExclusivo).toBeUndefined();
  });
});
