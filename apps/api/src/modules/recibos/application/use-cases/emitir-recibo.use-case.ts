import { serializarCanonico, type PayloadRecibo } from '../../domain/payload-recibo';
import type { DatosNuevoRecibo } from '../../domain/recibo';
import type { ClockPort } from '../../../../shared-kernel/clock.port';
import type { ConfiguracionCadenaPort } from '../ports/configuracion-cadena.port';
import type { CriptoPort } from '../ports/cripto.port';
import type { HasherRecibosPort } from '../ports/hasher-recibos.port';

export interface DatosEmisionRecibo {
  pagoId: string;
  numeroPoliza: string;
  monto: string;
  fechaPago: string;
  emitidoEn?: Date;
}

/**
 * Construye (sin persistir) los datos del recibo: código público, sal,
 * payload canónico, hash y idOnchain. La persistencia ocurre dentro de la
 * misma transacción que valida el pago.
 */
export class EmitirReciboUseCase {
  constructor(
    private readonly cripto: CriptoPort,
    private readonly hasher: HasherRecibosPort,
    private readonly cadena: ConfiguracionCadenaPort,
    private readonly clock: ClockPort,
  ) {}

  ejecutar(datos: DatosEmisionRecibo): DatosNuevoRecibo {
    const id = this.cripto.generarId();
    const codigo = this.cripto.generarCodigo();
    const sal = this.cripto.generarSal();
    const emitidoEn = (datos.emitidoEn ?? this.clock.ahora()).toISOString();

    const payload: PayloadRecibo = {
      codigo,
      pagoId: datos.pagoId,
      numeroPoliza: datos.numeroPoliza,
      monto: datos.monto,
      moneda: 'USD',
      fechaPago: datos.fechaPago,
      emitidoEn,
    };

    const payloadCanonico = serializarCanonico(payload);
    const hashRecibo = this.hasher.hashRecibo(payloadCanonico, sal);

    return {
      id,
      codigo,
      pagoId: datos.pagoId,
      idOnchain: this.hasher.hashTexto(id),
      hashRecibo: hashRecibo.hash,
      sal: hashRecibo.sal,
      payloadCanonico,
      chainId: this.cadena.chainId,
      contractAddress: this.cadena.obtenerContractAddress(),
      creadoEn: emitidoEn,
    };
  }
}
