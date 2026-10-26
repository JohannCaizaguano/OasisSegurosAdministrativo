import type { ReciboImprimible } from '@oasis/shared';
import { idUuidParamSchema } from '@oasis/shared';
import { Controller, Get } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';

import { Roles, UsuarioActual, type UsuarioAutenticado } from '../../../../common/auth/decorators';
import { ZodParam } from '../../../../common/pipes/zod-validation.pipe';
import { ObtenerReciboImprimibleUseCase } from '../../application/use-cases/obtener-recibo-imprimible.use-case';

@ApiTags('recibos')
@Controller('mis-recibos')
@Roles('CLIENTE')
export class MisRecibosController {
  constructor(private readonly obtenerImprimible: ObtenerReciboImprimibleUseCase) {}

  @Get(':id/imprimible')
  @ApiOperation({ summary: 'Recibo imprimible del cliente autenticado (HU-25; ajeno → 404)' })
  imprimible(
    @ZodParam(idUuidParamSchema) params: { id: string },
    @UsuarioActual() usuario: UsuarioAutenticado,
  ): Promise<ReciboImprimible> {
    return this.obtenerImprimible.ejecutar(params.id, { clienteId: usuario.clienteId });
  }
}
