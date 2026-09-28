import type { VerificacionPublica } from '@oasis/shared';
import { codigoReciboSchema } from '@oasis/shared';
import { Controller, Get } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';

import { Public } from '../../../../common/auth/decorators';
import { ZodParamCampo } from '../../../../common/pipes/zod-validation.pipe';
import { limitesThrottle } from '../../../../config/throttle';
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
  @Throttle({ default: { limit: limitesThrottle().verificacionPublica, ttl: 60_000 } })
  @Get(':codigo/verificacion')
  @ApiOperation({ summary: 'Verifica un recibo por su código público (sin login)' })
  // El código se valida con el mismo esquema que usa la SPA: evita consultas
  // con cadenas arbitrarias en el único endpoint público del sistema.
  async verificar(
    @ZodParamCampo('codigo', codigoReciboSchema) codigo: string,
  ): Promise<VerificacionPublica> {
    return this.verificarRecibo.ejecutar(codigo);
  }
}
