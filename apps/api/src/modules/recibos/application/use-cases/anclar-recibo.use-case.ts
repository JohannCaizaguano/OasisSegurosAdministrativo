import { NoEncontradoError, ReglaNegocioError } from '../../../../shared-kernel/domain-error';
import type { ClockPort } from '../../../../shared-kernel/clock.port';
import type { Recibo } from '../../domain/recibo';
import type { ConfiguracionCadenaPort } from '../ports/configuracion-cadena.port';
import type { RecibosRepositoryPort } from '../ports/recibos.repository.port';
import type { RegistroRecibosPort } from '../ports/registro-recibos.port';

export type ResultadoAnclaje = 'ANCLADO' | 'ENVIADO' | 'SIN_CAMBIOS';

export interface SalidaAnclaje {
  estado: ResultadoAnclaje;
  recibo: Recibo;
}

/**
 * Caso de uso idempotente del worker: sincroniza el recibo con la cadena
 * (recuperación tras caída incluida) y, si falta, envía `registrar` y espera
 * el receipt.
 */
export class AnclarReciboUseCase {
  constructor(
    private readonly recibos: RecibosRepositoryPort,
    private readonly registro: RegistroRecibosPort,
    private readonly cadena: ConfiguracionCadenaPort,
    private readonly clock: ClockPort,
  ) {}

  async ejecutar(reciboId: string): Promise<SalidaAnclaje> {
    const recibo = await this.recibos.buscarPorId(reciboId);
    if (!recibo) {
      throw new NoEncontradoError('Recibo', reciboId);
    }

    if (recibo.estaAnclado() || recibo.estaAnulado()) {
      return { estado: 'SIN_CAMBIOS', recibo };
    }

    try {
      const resultado = await this.anclar(recibo);
      return { estado: resultado, recibo };
    } catch (error) {
      recibo.registrarIntento(this.mensajeError(error));
      await this.recibos.guardar(recibo);
      throw error;
    }
  }

  private async anclar(recibo: Recibo): Promise<ResultadoAnclaje> {
    if (recibo.txHash) {
      const transaccion = await this.registro.consultarTransaccion(recibo.txHash);

      if (transaccion.estado === 'pendiente') {
        return 'ENVIADO';
      }

      if (transaccion.estado === 'confirmada') {
        const enCadena = await this.registro.obtenerEnCadena(recibo.idOnchain);
        if (enCadena.existe) {
          recibo.marcarAnclado(this.datosAnclaje(transaccion), this.clock.ahora());
          await this.recibos.guardar(recibo);
          return 'ANCLADO';
        }
        throw new ReglaNegocioError(
          'La transacción se confirmó pero el recibo no está en el contrato',
        );
      }

      // Revertida: se descarta el txHash y se reintenta el envío.
      recibo.registrarIntento('La transacción anterior revirtió en la cadena');
    }

    // Recuperación: el contrato ya lo tiene (por ejemplo, caída del worker
    // después de enviar pero antes de guardar el ANCLADO).
    const enCadena = await this.registro.obtenerEnCadena(recibo.idOnchain);
    if (enCadena.existe) {
      recibo.marcarAnclado(
        { blockNumber: null, gasUsed: null, effectiveGasPrice: null },
        this.clock.ahora(),
      );
      await this.recibos.guardar(recibo);
      return 'ANCLADO';
    }

    recibo.registrarIntento();
    const { txHash } = await this.registro.enviarRegistro(recibo.idOnchain, recibo.hashRecibo, {
      maxFeePerGasGwei: this.cadena.maxFeePerGasGwei,
    });
    recibo.marcarEnviado(txHash, this.clock.ahora());
    await this.recibos.guardar(recibo);

    const transaccion = await this.registro.consultarTransaccion(txHash);
    if (transaccion.estado === 'confirmada') {
      recibo.marcarAnclado(this.datosAnclaje(transaccion), this.clock.ahora());
      await this.recibos.guardar(recibo);
      return 'ANCLADO';
    }
    if (transaccion.estado === 'pendiente') {
      return 'ENVIADO';
    }

    throw new ReglaNegocioError('La transacción de anclaje revirtió en la cadena');
  }

  private datosAnclaje(transaccion: {
    blockNumber?: string;
    gasUsed?: string;
    effectiveGasPrice?: string;
  }) {
    return {
      blockNumber: transaccion.blockNumber ?? null,
      gasUsed: transaccion.gasUsed ?? null,
      effectiveGasPrice: transaccion.effectiveGasPrice ?? null,
    };
  }

  private mensajeError(error: unknown): string {
    if (error instanceof Error) {
      return error.message.slice(0, 500);
    }
    return String(error).slice(0, 500);
  }
}
