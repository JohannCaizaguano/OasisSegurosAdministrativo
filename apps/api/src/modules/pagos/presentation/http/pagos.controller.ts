import type {
  CrearPagoInput,
  Pago as PagoRespuesta,
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

import { Roles, UsuarioActual, type UsuarioAutenticado } from '../../../../common/auth/decorators';
import { ZodBody, ZodParam, ZodQuery } from '../../../../common/pipes/zod-validation.pipe';
import { TOKENS_TRANSVERSALES } from '../../../../shared-kernel/tokens';
import type { ClockPort } from '../../../../shared-kernel/clock.port';
import { ProhibidoError } from '../../../../shared-kernel/domain-error';
import { Inject } from '@nestjs/common';
import type { Pago } from '../../domain/pago';
import {
  CrearPagoUseCase,
  ListarPagosUseCase,
  RechazarPagoUseCase,
} from '../../application/use-cases/pagos.use-cases';
import { ValidarPagoUseCase } from '../../application/use-cases/validar-pago.use-case';

@ApiTags('pagos')
@Controller('pagos')
@Roles('ADMIN', 'OPERADOR')
export class PagosController {
  constructor(
    private readonly crearPago: CrearPagoUseCase,
    private readonly listarPagos: ListarPagosUseCase,
    private readonly validarPago: ValidarPagoUseCase,
    private readonly rechazarPago: RechazarPagoUseCase,
    @Inject(TOKENS_TRANSVERSALES.CLOCK) private readonly clock: ClockPort,
  ) {}

  @Post()
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

  @Patch(':id/validar')
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
  constructor(private readonly listarPagos: ListarPagosUseCase) {}

  @Get()
  @ApiOperation({ summary: 'Lista los pagos del cliente autenticado' })
  async listar(
    @UsuarioActual() usuario: UsuarioAutenticado,
    @ZodQuery(listarPagosQuerySchema)
    query: { page: number; pageSize: number; estado?: Pago['estado'] },
  ) {
    if (!usuario.clienteId) {
      throw new ProhibidoError('El usuario no está asociado a un cliente');
    }
    const pagina = await this.listarPagos.ejecutar({
      clienteId: usuario.clienteId,
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
        motivoRechazo: pago.motivoRechazo,
        createdAt: pago.createdAt,
        updatedAt: pago.updatedAt,
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
