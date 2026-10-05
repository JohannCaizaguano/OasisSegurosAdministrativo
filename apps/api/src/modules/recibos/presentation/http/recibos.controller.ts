import type { ReciboDetalle, ReciboResumen } from '@oasis/shared';
import { idUuidParamSchema, listarRecibosQuerySchema } from '@oasis/shared';
import { Controller, Get, HttpCode, HttpStatus, Inject, Post } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';

import { Auditar } from '../../../../common/auditoria/auditar.decorator';
import { Roles } from '../../../../common/auth/decorators';
import { ZodParam, ZodQuery } from '../../../../common/pipes/zod-validation.pipe';
import { AnularReciboUseCase } from '../../application/use-cases/anular-recibo.use-case';
import { ObtenerReciboUseCase } from '../../application/use-cases/obtener-recibo.use-case';
import { ReintentarReciboUseCase } from '../../application/use-cases/reintentar-recibo.use-case';
import {
  CONFIG_CADENA,
  type ConfiguracionCadenaPort,
} from '../../application/ports/configuracion-cadena.port';
import type { RecibosRepositoryPort } from '../../application/ports/recibos.repository.port';
import { RECIBOS_REPOSITORY } from '../../application/ports/recibos.repository.port';
import type { Recibo } from '../../domain/recibo';

@ApiTags('recibos')
@Controller('recibos')
@Roles('ADMIN', 'OPERADOR')
export class RecibosController {
  constructor(
    private readonly obtenerRecibo: ObtenerReciboUseCase,
    private readonly anularRecibo: AnularReciboUseCase,
    private readonly reintentarRecibo: ReintentarReciboUseCase,
    @Inject(RECIBOS_REPOSITORY) private readonly recibos: RecibosRepositoryPort,
    @Inject(CONFIG_CADENA) private readonly cadena: ConfiguracionCadenaPort,
  ) {}

  @Get()
  @ApiOperation({ summary: 'Lista recibos con paginación' })
  async listar(
    @ZodQuery(listarRecibosQuerySchema)
    query: {
      page: number;
      pageSize: number;
      estado?: Recibo['estado'];
    },
  ) {
    const pagina = await this.recibos.listar({
      pagina: query.page,
      porPagina: query.pageSize,
      estado: query.estado,
    });
    return {
      data: pagina.items.map((recibo) => this.aResumen(recibo)),
      meta: {
        page: query.page,
        pageSize: query.pageSize,
        total: pagina.total,
        totalPages: Math.ceil(pagina.total / query.pageSize),
      },
    };
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obtiene el detalle de un recibo' })
  async obtener(@ZodParam(idUuidParamSchema) params: { id: string }): Promise<ReciboDetalle> {
    return this.aDetalle(await this.obtenerRecibo.ejecutar(params.id));
  }

  @Post(':id/reintentar')
  @Auditar('REINTENTAR', 'Recibo')
  @HttpCode(HttpStatus.OK)
  @Roles('ADMIN')
  @ApiOperation({ summary: 'Reintenta el anclaje de un recibo FALLIDO (ADMIN)' })
  async reintentar(@ZodParam(idUuidParamSchema) params: { id: string }): Promise<ReciboDetalle> {
    return this.aDetalle(await this.reintentarRecibo.ejecutar(params.id));
  }

  @Post(':id/anular')
  @Auditar('ANULAR', 'Recibo')
  @HttpCode(HttpStatus.OK)
  @Roles('ADMIN')
  @ApiOperation({ summary: 'Anula un recibo (ADMIN)' })
  async anular(@ZodParam(idUuidParamSchema) params: { id: string }): Promise<ReciboDetalle> {
    return this.aDetalle(await this.anularRecibo.ejecutar(params.id));
  }

  private aResumen(recibo: Recibo): ReciboResumen {
    return {
      id: recibo.id,
      codigo: recibo.codigo,
      estado: recibo.estado,
      idOnchain: recibo.idOnchain,
      hashRecibo: recibo.hashRecibo,
      txHash: recibo.txHash,
      creadoEn: recibo.creadoEn,
      enviadoEn: recibo.enviadoEn,
      ancladoEn: recibo.ancladoEn,
    };
  }

  private aDetalle(recibo: Recibo): ReciboDetalle {
    return {
      ...this.aResumen(recibo),
      pagoId: recibo.pagoId,
      numeroPoliza: recibo.numeroPoliza ?? '',
      payloadCanonico: recibo.payloadCanonico,
      blockNumber: recibo.blockNumber,
      gasUsed: recibo.gasUsed,
      effectiveGasPrice: recibo.effectiveGasPrice,
      chainId: recibo.chainId,
      contractAddress: recibo.contractAddress,
      intentos: recibo.intentos,
      ultimoError: recibo.ultimoError,
      explorerUrl: recibo.txHash ? `${this.cadena.explorerBaseUrl}/tx/${recibo.txHash}` : null,
    };
  }
}
