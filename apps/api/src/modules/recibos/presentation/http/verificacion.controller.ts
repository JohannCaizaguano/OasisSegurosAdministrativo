import type { VerificacionRecibo } from '@oasis/shared';
import { codigoReciboSchema } from '@oasis/shared';
import { Controller, Get, UseGuards } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';

import { Roles, UsuarioActual, type UsuarioAutenticado } from '../../../../common/auth/decorators';
import { ZodParamCampo } from '../../../../common/pipes/zod-validation.pipe';
import { LimitePorUsuarioGuard } from '../../../../common/throttle/limite-por-usuario.guard';
import { VerificarReciboUseCase } from '../../application/use-cases/verificar-recibo.use-case';

@ApiTags('recibos')
@Controller('recibos')
export class VerificacionController {
  constructor(private readonly verificarRecibo: VerificarReciboUseCase) {}

  @Get(':codigo/verificacion')
  @Roles('ADMIN', 'OPERADOR', 'CLIENTE')
  @UseGuards(LimitePorUsuarioGuard)
  @ApiOperation({ summary: 'Verifica un recibo contra el contrato (HU-28; 30 por minuto)' })
  verificar(
    @ZodParamCampo('codigo', codigoReciboSchema) codigo: string,
    @UsuarioActual() usuario: UsuarioAutenticado,
  ): Promise<VerificacionRecibo> {
    // RN-07: el filtro del CLIENTE vive en el caso de uso, con su clienteId.
    return this.verificarRecibo.ejecutar(
      codigo,
      usuario.rol === 'CLIENTE' ? { clienteId: usuario.clienteId } : undefined,
    );
  }
}
