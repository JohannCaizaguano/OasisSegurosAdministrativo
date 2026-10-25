import type { SaldoOperadora } from '@oasis/shared';
import { Controller, Get } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';

import { Roles } from '../../../../common/auth/decorators';
import { ObtenerSaldoOperadoraUseCase } from '../../application/use-cases/obtener-saldo-operadora.use-case';

@ApiTags('operadora')
@Controller('operadora')
@Roles('ADMIN')
export class OperadoraController {
  constructor(private readonly obtenerSaldo: ObtenerSaldoOperadoraUseCase) {}

  @Get('saldo')
  @ApiOperation({ summary: 'Saldo de la cuenta operadora que publicó el worker (HU-42)' })
  saldo(): Promise<SaldoOperadora> {
    return this.obtenerSaldo.ejecutar();
  }
}
