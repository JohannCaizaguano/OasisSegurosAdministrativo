import type { FilaCartera, VistaCartera } from '@oasis/shared';
import { aCentavos, aMonto, fechaEnGuayaquil } from '@oasis/shared';

import type { ClockPort } from '../../../../shared-kernel/clock.port';
import { diasDeAtraso, rangoDeVista } from '../../domain/cartera';
import type { PolizasRepositoryPort } from '../ports/polizas.repository.port';

export interface ConsultaCartera {
  vista: VistaCartera;
  clienteId?: string;
  aseguradoraId?: string;
  desde?: string;
  hasta?: string;
  pagina: number;
  porPagina: number;
}

const mayor = (a: string | undefined, b: string | undefined) =>
  a && b ? (a > b ? a : b) : (a ?? b);
const menor = (a: string, b: string | undefined) => (b && b < a ? b : a);

/** HU-38 (D16): «hoy» es la fecha de Guayaquil del reloj, no el estado que dejó el cron. */
export class ListarCarteraUseCase {
  constructor(
    private readonly polizas: PolizasRepositoryPort,
    private readonly clock: ClockPort,
  ) {}

  async ejecutar(consulta: ConsultaCartera): Promise<{ items: FilaCartera[]; total: number }> {
    const hoy = fechaEnGuayaquil(this.clock.ahora());
    const rango = rangoDeVista(consulta.vista, hoy);
    const { items, total } = await this.polizas.listarCartera({
      vencimientoDesde: mayor(rango.desde, consulta.desde),
      vencimientoHasta: menor(rango.hasta, consulta.hasta),
      clienteId: consulta.clienteId,
      aseguradoraId: consulta.aseguradoraId,
      pagina: consulta.pagina,
      porPagina: consulta.porPagina,
    });
    return {
      items: items.map(({ valorPagado, ...cuota }) => ({
        ...cuota,
        pendiente: aMonto(aCentavos(cuota.valor) - aCentavos(valorPagado)),
        diasAtraso: diasDeAtraso(cuota.fechaVencimiento, hoy),
      })),
      total,
    };
  }
}
