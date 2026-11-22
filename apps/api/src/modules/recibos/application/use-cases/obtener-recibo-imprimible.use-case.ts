import type { ReciboImprimible } from '@oasis/shared';
import { enmascararIdentificacion } from '@oasis/shared';

import { NoEncontradoError } from '../../../../shared-kernel/domain-error';
import type { ConfiguracionCadenaPort } from '../ports/configuracion-cadena.port';
import type { RecibosRepositoryPort } from '../ports/recibos.repository.port';
import type { SolicitanteCliente } from './verificar-recibo.use-case';

/** HU-25 (D7): solo lo que se imprime; el recibo ajeno del CLIENTE es un 404 (RN-07). */
export class ObtenerReciboImprimibleUseCase {
  constructor(
    private readonly recibos: RecibosRepositoryPort,
    private readonly cadena: ConfiguracionCadenaPort,
  ) {}

  async ejecutar(id: string, cliente?: SolicitanteCliente): Promise<ReciboImprimible> {
    const datos = await this.recibos.buscarImprimible(id);
    if (
      !datos ||
      (cliente && (!cliente.clienteId || datos.poliza.clienteId !== cliente.clienteId))
    ) {
      throw new NoEncontradoError('Recibo', id);
    }
    return {
      codigo: datos.codigo,
      estadoAnclaje: datos.estado,
      emitidoEn: datos.creadoEn,
      ancladoEn: datos.ancladoEn,
      explorerUrl: datos.txHash ? `${this.cadena.explorerBaseUrl}/tx/${datos.txHash}` : null,
      pago: { ...datos.pago },
      poliza: {
        numero: datos.poliza.numero,
        ramo: datos.poliza.ramo,
        aseguradora: datos.poliza.aseguradora,
      },
      cliente: {
        nombre: datos.cliente.nombre,
        identificacionEnmascarada: enmascararIdentificacion(datos.cliente.identificacion),
      },
    };
  }
}
