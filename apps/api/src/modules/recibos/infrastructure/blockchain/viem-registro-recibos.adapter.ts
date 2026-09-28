import { Inject, Injectable, Optional } from '@nestjs/common';
import {
  TransactionReceiptNotFoundError,
  WaitForTransactionReceiptTimeoutError,
  getAddress,
  parseGwei,
  type Chain,
  type PublicClient,
  type WalletClient,
} from 'viem';
import { registroRecibosAbi } from '@oasis/shared';

import { ErrorDependenciaExterna } from '../../../../shared-kernel/domain-error';
import {
  APP_CHAIN,
  PUBLIC_CLIENT,
  WALLET_CLIENT,
} from '../../../../infrastructure/blockchain/blockchain.constants';
import {
  CONFIG_CADENA,
  type ConfiguracionCadenaPort,
} from '../../application/ports/configuracion-cadena.port';
import type {
  EstadoEnCadena,
  OpcionesEnvio,
  RegistroRecibosPort,
  ResultadoTransaccion,
} from '../../application/ports/registro-recibos.port';

const TIMEOUT_RECEIPT_MS = 120_000;

type Hex = `0x${string}`;

@Injectable()
export class ViemRegistroRecibosAdapter implements RegistroRecibosPort {
  constructor(
    @Inject(PUBLIC_CLIENT) private readonly publicClient: PublicClient,
    @Optional()
    @Inject(WALLET_CLIENT)
    private readonly walletClient: WalletClient | null,
    @Inject(CONFIG_CADENA) private readonly cadena: ConfiguracionCadenaPort,
    @Optional()
    @Inject(APP_CHAIN)
    private readonly chain: Chain | undefined,
  ) {}

  async obtenerEnCadena(idOnchain: string): Promise<EstadoEnCadena> {
    const resultado = await this.publicClient.readContract({
      address: this.direccion(),
      abi: registroRecibosAbi,
      functionName: 'verificar',
      args: [idOnchain as Hex],
    });
    const [existe, hashRecibo, registradoEn, anulado] = resultado;
    return { existe, hashRecibo, registradoEn: Number(registradoEn), anulado };
  }

  async enviarRegistro(
    idOnchain: string,
    hashRecibo: string,
    opciones: OpcionesEnvio,
  ): Promise<{ txHash: string }> {
    const wallet = this.requerirWallet();
    await this.publicClient.simulateContract({
      address: this.direccion(),
      abi: registroRecibosAbi,
      functionName: 'registrar',
      args: [idOnchain as Hex, hashRecibo as Hex],
      account: wallet.account ?? undefined,
    });
    const txHash = await wallet.writeContract({
      address: this.direccion(),
      abi: registroRecibosAbi,
      functionName: 'registrar',
      args: [idOnchain as Hex, hashRecibo as Hex],
      account: wallet.account ?? null,
      chain: this.chainRequerida(),
      maxFeePerGas: parseGwei(String(opciones.maxFeePerGasGwei)),
    });
    return { txHash };
  }

  async consultarTransaccion(txHash: string): Promise<ResultadoTransaccion> {
    try {
      const receipt = await this.publicClient.waitForTransactionReceipt({
        hash: txHash as Hex,
        confirmations: 1,
        timeout: TIMEOUT_RECEIPT_MS,
      });

      if (receipt.status !== 'success') {
        return { estado: 'revertida' };
      }

      return {
        estado: 'confirmada',
        blockNumber: receipt.blockNumber.toString(),
        gasUsed: receipt.gasUsed.toString(),
        effectiveGasPrice:
          receipt.effectiveGasPrice === undefined
            ? undefined
            : receipt.effectiveGasPrice.toString(),
      };
    } catch (error) {
      if (
        error instanceof TransactionReceiptNotFoundError ||
        error instanceof WaitForTransactionReceiptTimeoutError
      ) {
        return { estado: 'pendiente' };
      }
      throw error;
    }
  }

  async anular(
    idOnchain: string,
    motivoHash: string,
    opciones: OpcionesEnvio,
  ): Promise<{ txHash: string }> {
    const wallet = this.requerirWallet();
    await this.publicClient.simulateContract({
      address: this.direccion(),
      abi: registroRecibosAbi,
      functionName: 'anular',
      args: [idOnchain as Hex, motivoHash as Hex],
      account: wallet.account ?? undefined,
    });
    const txHash = await wallet.writeContract({
      address: this.direccion(),
      abi: registroRecibosAbi,
      functionName: 'anular',
      args: [idOnchain as Hex, motivoHash as Hex],
      account: wallet.account ?? null,
      chain: this.chainRequerida(),
      maxFeePerGas: parseGwei(String(opciones.maxFeePerGasGwei)),
    });
    return { txHash };
  }

  private direccion() {
    return getAddress(this.cadena.obtenerContractAddress());
  }

  private chainRequerida(): Chain {
    if (!this.chain) {
      throw new ErrorDependenciaExterna(
        'CHAIN_ID no corresponde a una red soportada (hardhat, polygonAmoy o polygon)',
      );
    }
    return this.chain;
  }

  private requerirWallet(): WalletClient {
    if (!this.walletClient) {
      throw new ErrorDependenciaExterna(
        'Esta operación de escritura requiere la cuenta operadora y solo existe en el worker',
      );
    }
    return this.walletClient;
  }
}
