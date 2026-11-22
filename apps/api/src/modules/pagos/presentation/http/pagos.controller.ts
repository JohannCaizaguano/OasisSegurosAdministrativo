import type {
  CrearPagoInput,
  Pago as PagoRespuesta,
  PagoCliente,
  PagoDetalle,
  RechazarPagoInput,
  ValidarPagoInput,
  ValidarPagoResponse,
} from '@oasis/shared';
import {
  crearPagoSchema,
  idUuidParamSchema,
  listarPagosQuerySchema,
  rechazarPagoSchema,
  validarPagoSchema,
} from '@oasis/shared';
import { Controller, Get, HttpCode, HttpStatus, Patch, Post } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';

import { Auditar } from '../../../../common/auditoria/auditar.decorator';
import { Roles, UsuarioActual, type UsuarioAutenticado } from '../../../../common/auth/decorators';
import { ZodBody, ZodParam, ZodQuery } from '../../../../common/pipes/zod-validation.pipe';
import { TOKENS_TRANSVERSALES } from '../../../../shared-kernel/tokens';
import type { ClockPort } from '../../../../shared-kernel/clock.port';
import { Inject } from '@nestjs/common';
import type { Pago } from '../../domain/pago';
import { ListarPagosDeClienteUseCase } from '../../application/use-cases/listar-pagos-de-cliente.use-case';
import {
  CrearPagoUseCase,
  ListarPagosUseCase,
  RechazarPagoUseCase,
} from '../../application/use-cases/pagos.use-cases';
import { ObtenerPagoUseCase } from '../../application/use-cases/obtener-pago.use-case';
import { ValidarPagoUseCase } from '../../application/use-cases/validar-pago.use-case';

@ApiTags('pagos')
@Controller('pagos')
@Roles('ADMIN', 'OPERADOR')
export class PagosController {
  constructor(
    private readonly crearPago: CrearPagoUseCase,
    private readonly listarPagos: ListarPagosUseCase,
    private readonly obtenerPago: ObtenerPagoUseCase,
    private readonly validarPago: ValidarPagoUseCase,
    private readonly rechazarPago: RechazarPagoUseCase,
    @Inject(TOKENS_TRANSVERSALES.CLOCK) private readonly clock: ClockPort,
  ) {}

  @Post()
  @Auditar('CREAR', 'Pago')
  @ApiOperation({ summary: 'Registra un pago' })
  async crear(
    @ZodBody(crearPagoSchema) datos: CrearPagoInput,
    @UsuarioActual() usuario: UsuarioAutenticado,
  ) {
    return this.aRespuesta(
      await this.crearPago.ejecutar({ ...datos, registradoPorId: usuario.id }),
    );
  }

  @Get()
  @ApiOperation({ summary: 'Lista pagos con filtros y paginación' })
  async listar(
    @ZodQuery(listarPagosQuerySchema)
    query: {
      page: number;
      pageSize: number;
      estado?: Pago['estado'];
      polizaId?: string;
      clienteId?: string;
      desde?: string;
      hasta?: string;
      q?: string;
    },
  ) {
    const pagina = await this.listarPagos.ejecutar({
      pagina: query.page,
      porPagina: query.pageSize,
      estado: query.estado,
      polizaId: query.polizaId,
      clienteId: query.clienteId,
      desde: query.desde,
      hasta: query.hasta,
      q: query.q,
    });
    return {
      data: pagina.items.map((pago) => this.aRespuesta(pago)),
      meta: {
        page: query.page,
        pageSize: query.pageSize,
        total: pagina.total,
        totalPages: Math.ceil(pagina.total / query.pageSize),
      },
    };
  }

  @Get(':id')
  @ApiOperation({ summary: 'Detalle del pago: cuotas a las que se aplicó y su recibo (HU-36)' })
  async obtener(@ZodParam(idUuidParamSchema) params: { id: string }): Promise<PagoDetalle> {
    const { pago, aplicaciones } = await this.obtenerPago.ejecutar(params.id);
    return { ...this.aRespuesta(pago), aplicaciones, recibo: pago.recibo };
  }

  @Patch(':id/validar')
  @Auditar('VALIDAR', 'Pago')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Valida el pago y emite el recibo (dispara el anclaje)' })
  async validar(
    @ZodParam(idUuidParamSchema) params: { id: string },
    @ZodBody(validarPagoSchema) body: ValidarPagoInput,
    @UsuarioActual() usuario: UsuarioAutenticado,
  ): Promise<ValidarPagoResponse> {
    const { pago, recibo } = await this.validarPago.ejecutar(params.id, usuario.id, body.nota);
    return {
      pago: this.aRespuesta(pago),
      recibo: {
        id: recibo.id,
        codigo: recibo.codigo,
        estado: recibo.estado,
        idOnchain: recibo.idOnchain,
        hashRecibo: recibo.hashRecibo,
        txHash: recibo.txHash,
        creadoEn: recibo.creadoEn,
        enviadoEn: recibo.enviadoEn,
        ancladoEn: recibo.ancladoEn,
      },
    };
  }

  @Patch(':id/rechazar')
  @Auditar('RECHAZAR', 'Pago')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Rechaza un pago registrado' })
  async rechazar(
    @ZodParam(idUuidParamSchema) params: { id: string },
    @ZodBody(rechazarPagoSchema) body: RechazarPagoInput,
    @UsuarioActual() usuario: UsuarioAutenticado,
  ) {
    return this.aRespuesta(
      await this.rechazarPago.ejecutar(params.id, usuario.id, this.clock.ahora(), body.motivo),
    );
  }

  private aRespuesta(pago: Pago): PagoRespuesta {
    return {
      id: pago.id,
      polizaId: pago.polizaId,
      numeroPoliza: pago.numeroPoliza,
      monto: pago.monto,
      fechaPago: pago.fechaPago,
      metodo: pago.metodo,
      referencia: pago.referencia,
      estado: pago.estado,
      registradoPorId: pago.registradoPorId,
      validadoPorId: pago.validadoPorId,
      validadoEn: pago.validadoEn,
      rechazadoPorId: pago.rechazadoPorId,
      rechazadoEn: pago.rechazadoEn,
      nota: pago.nota,
      motivoRechazo: pago.motivoRechazo,
      createdAt: pago.createdAt,
      updatedAt: pago.updatedAt,
    };
  }
}

@ApiTags('pagos')
@Controller('mis-pagos')
@Roles('CLIENTE')
export class MisPagosController {
  constructor(private readonly listarPagos: ListarPagosDeClienteUseCase) {}

  @Get()
  @ApiOperation({ summary: 'Lista los pagos del cliente autenticado' })
  async listar(
    @UsuarioActual() usuario: UsuarioAutenticado,
    @ZodQuery(listarPagosQuerySchema)
    query: { page: number; pageSize: number; estado?: Pago['estado'] },
  ): Promise<{ data: PagoCliente[]; meta: Record<string, number> }> {
    const pagina = await this.listarPagos.ejecutar(usuario.clienteId, {
      pagina: query.page,
      porPagina: query.pageSize,
      estado: query.estado,
    });
    return {
      data: pagina.items.map((pago) => ({
        id: pago.id,
        polizaId: pago.polizaId,
        numeroPoliza: pago.numeroPoliza,
        monto: pago.monto,
        fechaPago: pago.fechaPago,
        metodo: pago.metodo,
        referencia: pago.referencia,
        estado: pago.estado,
        validadoEn: pago.validadoEn,
        rechazadoEn: pago.rechazadoEn,
        motivoRechazo: pago.motivoRechazo,
        createdAt: pago.createdAt,
        updatedAt: pago.updatedAt,
        recibo:
          pago.estado === 'VALIDADO' && pago.recibo
            ? { id: pago.recibo.id, codigo: pago.recibo.codigo }
            : null,
      })),
      meta: {
        page: query.page,
        pageSize: query.pageSize,
        total: pagina.total,
        totalPages: Math.ceil(pagina.total / query.pageSize),
      },
    };
  }
}
