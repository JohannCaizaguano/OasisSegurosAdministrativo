import type { Cuota, DefinirPlanCuotasInput } from '@oasis/shared';
import { definirPlanCuotasSchema, idUuidParamSchema } from '@oasis/shared';
import { Controller, Get, HttpCode, Put } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';

import { Auditar } from '../../../../common/auditoria/auditar.decorator';
import { Roles } from '../../../../common/auth/decorators';
import { ZodBody, ZodParam } from '../../../../common/pipes/zod-validation.pipe';
import {
  DefinirPlanCuotasUseCase,
  ObtenerPlanCuotasUseCase,
} from '../../application/use-cases/cuotas.use-cases';

@ApiTags('polizas')
@Controller('polizas/:id/cuotas')
@Roles('ADMIN', 'OPERADOR')
export class CuotasController {
  constructor(
    private readonly obtenerPlan: ObtenerPlanCuotasUseCase,
    private readonly definirPlan: DefinirPlanCuotasUseCase,
  ) {}

  @Get()
  @ApiOperation({ summary: 'Devuelve el plan de cuotas de la póliza (HU-35)' })
  obtener(@ZodParam(idUuidParamSchema) params: { id: string }): Promise<Cuota[]> {
    return this.obtenerPlan.ejecutar(params.id);
  }

  @Put()
  @Auditar('MODIFICAR', 'PlanCuotas')
  @HttpCode(200)
  @ApiOperation({ summary: 'Reemplaza el plan de cuotas de una póliza sin pagos validados (D11)' })
  definir(
    @ZodParam(idUuidParamSchema) params: { id: string },
    @ZodBody(definirPlanCuotasSchema) datos: DefinirPlanCuotasInput,
  ): Promise<Cuota[]> {
    return this.definirPlan.ejecutar(params.id, datos.cuotas);
  }
}
