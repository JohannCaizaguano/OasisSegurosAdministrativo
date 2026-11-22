import type { Cuota, DefinirPlanCuotasInput, FilaCartera, ListarCarteraQuery } from '@oasis/shared';
import {
  definirPlanCuotasSchema,
  idUuidParamSchema,
  listarCarteraQuerySchema,
} from '@oasis/shared';
import { Controller, Get, HttpCode, Put } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';

import { Auditar } from '../../../../common/auditoria/auditar.decorator';
import { Roles } from '../../../../common/auth/decorators';
import { ZodBody, ZodParam, ZodQuery } from '../../../../common/pipes/zod-validation.pipe';
import { ListarCarteraUseCase } from '../../application/use-cases/listar-cartera.use-case';
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

@ApiTags('polizas')
@Controller('cuotas')
@Roles('ADMIN', 'OPERADOR')
export class CarteraController {
  constructor(private readonly listarCartera: ListarCarteraUseCase) {}

  @Get()
  @ApiOperation({ summary: 'Cartera: cuotas por vencer en 7 días y vencidas (HU-38)' })
  async listar(@ZodQuery(listarCarteraQuerySchema) query: ListarCarteraQuery): Promise<{
    data: FilaCartera[];
    meta: { page: number; pageSize: number; total: number; totalPages: number };
  }> {
    const { items, total } = await this.listarCartera.ejecutar({
      vista: query.vista,
      clienteId: query.clienteId,
      aseguradoraId: query.aseguradoraId,
      desde: query.desde,
      hasta: query.hasta,
      pagina: query.page,
      porPagina: query.pageSize,
    });
    return {
      data: items,
      meta: {
        page: query.page,
        pageSize: query.pageSize,
        total,
        totalPages: Math.ceil(total / query.pageSize),
      },
    };
  }
}
