import type { VerificacionPublica } from '@oasis/shared';
import { Controller, Get, Param } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';

import { Public } from '../../../../common/auth/decorators';
import { VerificarReciboUseCase } from '../../application/use-cases/verificar-recibo.use-case';

/**
 * Verificación pública de recibos: sin autenticación, con throttling estricto
 * y sin exponer ningún dato personal.
 */
@ApiTags('publico')
@Controller('public/recibos')
export class VerificacionPublicaController {
  constructor(private readonly verificarRecibo: VerificarReciboUseCase) {}

  @Public()
  @Throttle({ default: { limit: 20, ttl: 60_000 } })
  @Get(':codigo/verificacion')
  @ApiOperation({ summary: 'Verifica un recibo por su código público (sin login)' })
  async verificar(@Param('codigo') codigo: string): Promise<VerificacionPublica> {
    return this.verificarRecibo.ejecutar(codigo);
  }
}
