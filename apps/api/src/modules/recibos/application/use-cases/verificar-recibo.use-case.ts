import type { EstadoVerificacion } from '@oasis/shared';

import type { ClockPort } from '../../../../shared-kernel/clock.port';
import type { ConfiguracionCadenaPort } from '../ports/configuracion-cadena.port';
import type { HasherRecibosPort } from '../ports/hasher-recibos.port';
import type { RecibosRepositoryPort } from '../ports/recibos.repository.port';
import type { RegistroRecibosPort } from '../ports/registro-recibos.port';

const HASH_CERO = `0x${'0'.repeat(64)}`;

export interface ResultadoVerificacion {
  codigo: string;
  estado: EstadoVerificacion;
  hashRecibo: string;
  hashOnchain: string | null;
  txHash: string | null;
  blockNumber: string | null;
  ancladoEn: string | null;
  chainId: number;
  contractAddress: string;
  explorerUrl: string | null;
  verificadoEn: string;
}

/**
 * Verificación pública: recalcula el hash desde la base de datos, lo compara
 * con el registrado en la cadena y devuelve solo datos opacos (sin información
 * personal).
 */
export class VerificarReciboUseCase {
  constructor(
    private readonly recibos: RecibosRepositoryPort,
    private readonly registro: RegistroRecibosPort,
    private readonly hasher: HasherRecibosPort,
    private readonly cadena: ConfiguracionCadenaPort,
    private readonly clock: ClockPort,
  ) {}

  async ejecutar(codigo: string): Promise<ResultadoVerificacion> {
    const verificadoEn = this.clock.ahora().toISOString();
    const recibo = await this.recibos.buscarPorCodigo(codigo);

    if (!recibo) {
      return {
        codigo,
        estado: 'NO_ENCONTRADO',
        hashRecibo: HASH_CERO,
        hashOnchain: null,
        txHash: null,
        blockNumber: null,
        ancladoEn: null,
        chainId: this.cadena.chainId,
        contractAddress: this.cadena.obtenerContractAddress(),
        explorerUrl: null,
        verificadoEn,
      };
    }

    const hashRecalculado = this.hasher.hashRecibo(recibo.payloadCanonico, recibo.sal).hash;

    const enCadena = await this.registro.obtenerEnCadena(recibo.idOnchain);

    let estado: EstadoVerificacion;
    if (!enCadena.existe) {
      estado = 'NO_ANCLADO';
    } else if (enCadena.hashRecibo.toLowerCase() !== hashRecalculado.toLowerCase()) {
      estado = 'HASH_INCONSISTENTE';
    } else if (enCadena.anulado || recibo.estaAnulado()) {
      estado = 'ANULADO';
    } else {
      estado = 'VALIDO';
    }

    return {
      codigo: recibo.codigo,
      estado,
      hashRecibo: hashRecalculado,
      hashOnchain: enCadena.existe ? enCadena.hashRecibo : null,
      txHash: recibo.txHash,
      blockNumber: recibo.blockNumber,
      ancladoEn: recibo.ancladoEn,
      chainId: recibo.chainId,
      contractAddress: recibo.contractAddress,
      explorerUrl: recibo.txHash ? `${this.cadena.explorerBaseUrl}/tx/${recibo.txHash}` : null,
      verificadoEn,
    };
  }
}
