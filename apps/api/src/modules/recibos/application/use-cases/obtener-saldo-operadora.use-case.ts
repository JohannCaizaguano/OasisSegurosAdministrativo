import type { SaldoOperadora } from '@oasis/shared';

import type { SaldoOperadoraPort } from '../ports/saldo-operadora.port';

export class ObtenerSaldoOperadoraUseCase {
  constructor(private readonly saldos: SaldoOperadoraPort) {}

  ejecutar(): Promise<SaldoOperadora> {
    return this.saldos.leer();
  }
}
