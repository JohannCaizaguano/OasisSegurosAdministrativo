import type { EstadoVerificacion } from '@oasis/shared';

import type { ClockPort } from '../../../../shared-kernel/clock.port';
import { DomainError, ErrorDependenciaExterna } from '../../../../shared-kernel/domain-error';
import type { Recibo } from '../../domain/recibo';
import type { ConfiguracionCadenaPort } from '../ports/configuracion-cadena.port';
import type { HasherRecibosPort } from '../ports/hasher-recibos.port';
import type { RecibosRepositoryPort } from '../ports/recibos.repository.port';
import type { EstadoEnCadena, RegistroRecibosPort } from '../ports/registro-recibos.port';

const HASH_CERO = `0x${'0'.repeat(64)}`;

export interface ResultadoVerificacion {
  codigo: string;
  estado: EstadoVerificacion;
  hashRecibo: string;
  /** Ausente para el CLIENTE (D5). */
  hashOnchain?: string | null;
  txHash: string | null;
  blockNumber: string | null;
  ancladoEn: string | null;
  chainId: number;
  /** Ausente para el CLIENTE; null solo si el recibo no existe y no hay despliegue. */
  contractAddress?: string | null;
  explorerUrl: string | null;
  verificadoEn: string;
}

/** Quién verifica: el CLIENTE solo ve los recibos de su `clienteId` (D3, RN-07). */
export interface SolicitanteCliente {
  clienteId: string | null | undefined;
}

/**
 * Verificación de un recibo: recalcula el hash desde la base de datos, lo
 * compara con el registrado en la cadena y devuelve solo datos opacos.
 */
export class VerificarReciboUseCase {
  constructor(
    private readonly recibos: RecibosRepositoryPort,
    private readonly registro: RegistroRecibosPort,
    private readonly hasher: HasherRecibosPort,
    private readonly cadena: ConfiguracionCadenaPort,
    private readonly clock: ClockPort,
  ) {}

  async ejecutar(codigo: string, cliente?: SolicitanteCliente): Promise<ResultadoVerificacion> {
    const verificadoEn = this.clock.ahora().toISOString();
    const encontrado = await this.recibos.buscarPorCodigo(codigo);
    // D3: un recibo ajeno se responde como inexistente y sin consultar la cadena.
    const recibo =
      encontrado && (!cliente || (cliente.clienteId && encontrado.clienteId === cliente.clienteId))
        ? encontrado
        : null;

    const resultado = recibo
      ? await this.verificar(recibo, verificadoEn)
      : this.noEncontrado(codigo, verificadoEn);

    if (!cliente) {
      return resultado;
    }
    const {
      hashOnchain: _hashOnchain,
      contractAddress: _contractAddress,
      ...paraCliente
    } = resultado;
    return paraCliente;
  }

  private noEncontrado(codigo: string, verificadoEn: string): ResultadoVerificacion {
    // Sin recibo no hay snapshot propio: la variante que no lanza permite responder
    // NO_ENCONTRADO aunque no haya contrato desplegado.
    return {
      codigo,
      estado: 'NO_ENCONTRADO',
      hashRecibo: HASH_CERO,
      hashOnchain: null,
      txHash: null,
      blockNumber: null,
      ancladoEn: null,
      chainId: this.cadena.chainId,
      contractAddress: this.cadena.contractAddressSiExiste(),
      explorerUrl: null,
      verificadoEn,
    };
  }

  private async verificar(recibo: Recibo, verificadoEn: string): Promise<ResultadoVerificacion> {
    const hashRecalculado = this.hasher.hashRecibo(recibo.payloadCanonico, recibo.sal).hash;
    // La anulación en la base es definitiva: no depende de la cadena y un RPC caído no puede
    // convertir un ANULADO en un 502.
    const anulado = recibo.estaAnulado();
    const enCadena = anulado ? null : await this.leerCadena(recibo.idOnchain);

    let estado: EstadoVerificacion;
    if (anulado || enCadena?.anulado) {
      estado = 'ANULADO';
    } else if (!enCadena?.existe) {
      estado = 'EN_PROCESO';
    } else if (enCadena.hashRecibo.toLowerCase() !== hashRecalculado.toLowerCase()) {
      estado = 'NO_COINCIDE';
    } else {
      estado = 'AUTENTICO';
    }

    return {
      codigo: recibo.codigo,
      estado,
      hashRecibo: hashRecalculado,
      hashOnchain: enCadena?.existe ? enCadena.hashRecibo : null,
      txHash: recibo.txHash,
      blockNumber: recibo.blockNumber,
      ancladoEn: recibo.ancladoEn,
      chainId: recibo.chainId,
      contractAddress: recibo.contractAddress,
      explorerUrl: recibo.txHash ? `${this.cadena.explorerBaseUrl}/tx/${recibo.txHash}` : null,
      verificadoEn,
    };
  }

  /** Un RPC caído es un 502, nunca un resultado de verificación falso. */
  private async leerCadena(idOnchain: string): Promise<EstadoEnCadena> {
    try {
      return await this.registro.obtenerEnCadena(idOnchain);
    } catch (error: unknown) {
      if (error instanceof DomainError) throw error;
      throw new ErrorDependenciaExterna('No se pudo consultar el registro de recibos en la red');
    }
  }
}
