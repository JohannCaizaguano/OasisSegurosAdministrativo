import { Inject, Injectable, type OnApplicationBootstrap } from '@nestjs/common';
import { Interval } from '@nestjs/schedule';
import { PinoLogger } from 'nestjs-pino';
import { formatEther, parseEther, type PublicClient, type WalletClient } from 'viem';

import {
  PUBLIC_CLIENT,
  WALLET_CLIENT,
} from '../../../../infrastructure/blockchain/blockchain.constants';
import { MetricsService } from '../../../../infrastructure/metrics/metrics.service';
import type { ClockPort } from '../../../../shared-kernel/clock.port';
import { TOKENS_TRANSVERSALES } from '../../../../shared-kernel/tokens';
import {
  SALDO_OPERADORA,
  type SaldoOperadoraPort,
} from '../../application/ports/saldo-operadora.port';

export const UMBRAL_SALDO_OPERADORA = Symbol('UMBRAL_SALDO_OPERADORA_POL');

const INTERVALO_MS = 300_000;

/** HU-42 (D17): lee el saldo de la cuenta operadora al arrancar y cada 5 minutos. */
@Injectable()
export class SaldoOperadoraTask implements OnApplicationBootstrap {
  constructor(
    @Inject(PUBLIC_CLIENT) private readonly publicClient: PublicClient,
    @Inject(WALLET_CLIENT) private readonly walletClient: WalletClient,
    @Inject(SALDO_OPERADORA) private readonly saldos: SaldoOperadoraPort,
    private readonly metrics: MetricsService,
    @Inject(TOKENS_TRANSVERSALES.CLOCK) private readonly clock: ClockPort,
    private readonly logger: PinoLogger,
    @Inject(UMBRAL_SALDO_OPERADORA) private readonly umbralPol: string,
  ) {
    this.logger.setContext(SaldoOperadoraTask.name);
  }

  onApplicationBootstrap(): void {
    void this.actualizar();
  }

  /** Nunca lanza: si el RPC falla, el panel conserva la última lectura hasta su TTL. */
  @Interval(INTERVALO_MS)
  async actualizar(): Promise<void> {
    const direccion = this.walletClient.account?.address;
    if (!direccion) return;
    try {
      const wei = await this.publicClient.getBalance({ address: direccion });
      const pol = formatEther(wei);
      const bajoUmbral = wei < parseEther(this.umbralPol);
      await this.saldos.guardar({
        wei: wei.toString(),
        pol,
        umbralPol: this.umbralPol,
        bajoUmbral,
        actualizadoEn: this.clock.ahora().toISOString(),
      });
      this.metrics.operadoraSaldoPol.set(Number(pol));
      if (bajoUmbral) {
        this.logger.warn(
          { evento: 'saldo-operadora-bajo', pol, umbralPol: this.umbralPol },
          'Saldo de la cuenta operadora bajo el umbral',
        );
      }
    } catch (error) {
      this.logger.warn(
        { evento: 'saldo-operadora-sin-lectura', err: error },
        'No se pudo leer el saldo de la cuenta operadora',
      );
    }
  }
}
