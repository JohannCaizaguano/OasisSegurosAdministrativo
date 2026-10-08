import type { NestExpressApplication } from '@nestjs/platform-express';
import { Test } from '@nestjs/testing';
import cookieParser from 'cookie-parser';
import request from 'supertest';

import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/infrastructure/prisma/prisma.service';
import { cedulaValida } from './identificaciones';

/**
 * E2E de HU-12 (registrar), HU-13 (editar y cambiar estado) y HU-14 (listar) de
 * pólizas. Cada caso crea su propia póliza (D19): la del seed nunca se toca.
 * Requiere PostgreSQL migrado y el seed cargado.
 */
describe('Pólizas (e2e)', () => {
  let app: NestExpressApplication;
  let prisma: PrismaService;
  let tokenOperador: string;
  let tokenCliente: string;
  let aseguradoraId: string;
  let ramoId: string;

  const sufijo = Date.now();
  let contadorIp = 0;
  let contadorClientes = 0;
  let contadorPolizas = 0;

  function ip(): string {
    contadorIp += 1;
    return `192.0.2.${(contadorIp % 250) + 1}`;
  }

  function conSesion(
    metodo: 'get' | 'post' | 'patch' | 'delete',
    ruta: string,
    token = tokenOperador,
  ) {
    return request(app.getHttpServer())
      [metodo](ruta)
      .set('X-Forwarded-For', ip())
      .set('Authorization', `Bearer ${token}`);
  }

  async function clienteNuevo(): Promise<string> {
    contadorClientes += 1;
    const creado = await conSesion('post', '/api/v1/clientes')
      .send({
        tipoIdentificacion: 'CEDULA',
        identificacion: cedulaValida(sufijo + 500 + contadorClientes),
        nombres: 'Cliente',
        apellidos: `Póliza ${contadorClientes}`,
        email: `poliza.cliente.${contadorClientes}.${sufijo}@example.com`,
      })
      .expect(201);
    return creado.body.id as string;
  }

  function crearPoliza(clienteId: string, datos: Record<string, unknown> = {}) {
    contadorPolizas += 1;
    return conSesion('post', '/api/v1/polizas').send({
      numero: `POL-E2E-${sufijo}-${contadorPolizas}`,
      clienteId,
      aseguradoraId,
      ramoId,
      primaTotal: '500.00',
      fechaInicio: '2026-11-01',
      fechaFin: '2027-10-31',
      ...datos,
    });
  }

  function listarPolizas(query: Record<string, unknown>) {
    return conSesion('get', '/api/v1/polizas').query(query);
  }

  function cambiarEstado(id: string, estado: 'VENCIDA' | 'CANCELADA') {
    return conSesion('post', `/api/v1/polizas/${id}/estado`).send({ estado });
  }

  function editarPoliza(id: string, datos: Record<string, unknown>) {
    return conSesion('patch', `/api/v1/polizas/${id}`).send(datos);
  }

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({ imports: [AppModule] }).compile();
    app = moduleRef.createNestApplication<NestExpressApplication>({ logger: false });
    app.set('trust proxy', 1);
    app.use(cookieParser());
    app.setGlobalPrefix('api/v1', { exclude: ['metrics'] });
    await app.init();

    prisma = app.get(PrismaService);
    aseguradoraId = (await prisma.aseguradora.findFirstOrThrow()).id;
    ramoId = (await prisma.ramo.findUniqueOrThrow({ where: { codigo: 'VEHICULOS' } })).id;

    const loginOperador = await request(app.getHttpServer())
      .post('/api/v1/auth/login')
      .set('X-Forwarded-For', ip())
      .send({ email: 'operador@oasis.com', password: 'Operador.Oasis1' })
      .expect(200);
    tokenOperador = loginOperador.body.accessToken as string;

    const loginCliente = await request(app.getHttpServer())
      .post('/api/v1/auth/login')
      .set('X-Forwarded-For', ip())
      .send({ email: 'cliente@oasis.com', password: 'Cliente.Oasis1' })
      .expect(200);
    tokenCliente = loginCliente.body.accessToken as string;
  });

  afterAll(async () => {
    await app?.close();
  });

  it('crea una póliza VIGENTE con su ramo y ramoId (HU-12.1 y HU-12.4)', async () => {
    const clienteId = await clienteNuevo();

    const respuesta = await crearPoliza(clienteId, { primaTotal: '1500.50' }).expect(201);

    expect(respuesta.body.estado).toBe('VIGENTE');
    expect(respuesta.body.ramoId).toBe(ramoId);
    expect(respuesta.body.ramo).toBe('Vehículos');
    expect(respuesta.body.tienePagosValidados).toBe(false);
    expect(respuesta.body.clienteNombre).toContain('Cliente');
    expect(respuesta.body.aseguradoraNombre).toBeTruthy();
  });

  it('rechaza fin igual al inicio y primas inválidas (HU-12.2, HU-12.3, RN-10)', async () => {
    const clienteId = await clienteNuevo();
    const inicio = '2026-11-01';

    const finIgual = await crearPoliza(clienteId, {
      fechaInicio: inicio,
      fechaFin: inicio,
    }).expect(400);
    expect(JSON.stringify(finIgual.body.details)).toContain('fechaFin');

    await crearPoliza(clienteId, { primaTotal: '0' }).expect(400);
    await crearPoliza(clienteId, { primaTotal: '1.234' }).expect(400);
  });

  it('rechaza una póliza para un cliente inactivo (HU-08.4, D9)', async () => {
    const clienteId = await clienteNuevo();
    await conSesion('post', `/api/v1/clientes/${clienteId}/desactivar`).expect(200);

    const respuesta = await crearPoliza(clienteId).expect(422);
    expect(respuesta.body.details).toEqual({
      campo: 'clienteId',
      motivo: 'CLIENTE_INACTIVO',
    });
  });

  it('rechaza número duplicado y ramo inexistente (HU-12.1, D9)', async () => {
    const clienteId = await clienteNuevo();
    const numero = `POL-DUP-${sufijo}`;
    await crearPoliza(clienteId, { numero }).expect(201);

    const duplicado = await crearPoliza(clienteId, { numero }).expect(409);
    expect(duplicado.body.details).toEqual({ campo: 'numero', motivo: 'NUMERO_DUPLICADO' });

    const ramoInexistente = await crearPoliza(clienteId, {
      ramoId: '00000000-0000-4000-8000-000000000000',
    }).expect(422);
    expect(ramoInexistente.body.details).toEqual({
      campo: 'ramoId',
      motivo: 'RAMO_INVALIDO',
    });
  });

  it('lista los ramos activos del seed y el CLIENTE no accede (D10)', async () => {
    const respuesta = await conSesion('get', '/api/v1/ramos').expect(200);
    const ramos = respuesta.body as Array<{ id: string; codigo: string; nombre: string }>;

    expect(ramos.map((ramo) => ramo.codigo).sort()).toEqual([
      'FIANZAS',
      'INCENDIO',
      'SALUD',
      'VEHICULOS',
      'VIDA',
    ]);
    expect(ramos.every((ramo) => ramo.id.length > 0 && ramo.nombre.length > 0)).toBe(true);

    await conSesion('get', '/api/v1/ramos', tokenCliente).expect(403);
  });

  it('edita una póliza vigente y rechaza clienteId o estado en el PATCH (HU-13, D11)', async () => {
    const clienteId = await clienteNuevo();
    const creada = await crearPoliza(clienteId).expect(201);
    const id = creada.body.id as string;

    const editada = await editarPoliza(id, {
      primaTotal: '2000.00',
      fechaFin: '2027-11-30',
    }).expect(200);
    expect(Number(editada.body.primaTotal)).toBe(2000);
    expect(editada.body.fechaFin).toBe('2027-11-30');

    const conCliente = await editarPoliza(id, { clienteId }).expect(400);
    expect(JSON.stringify(conCliente.body.details)).toContain('clienteId');

    const conEstado = await editarPoliza(id, { estado: 'CANCELADA' }).expect(400);
    expect(JSON.stringify(conEstado.body.details)).toContain('estado');
  });

  it('bloquea la prima con pagos validados y permite editar otro campo (HU-13.3)', async () => {
    const clienteId = await clienteNuevo();
    const creada = await crearPoliza(clienteId, { primaTotal: '500.00' }).expect(201);
    const id = creada.body.id as string;
    const metodo = await prisma.metodoPago.findUniqueOrThrow({
      where: { codigo: 'TRANSFERENCIA' },
    });
    await prisma.pago.create({
      data: {
        polizaId: id,
        monto: '50.00',
        fechaPago: new Date(),
        metodoPagoId: metodo.id,
        referencia: `E2E-POL-${sufijo}`,
        estado: 'VALIDADO',
      },
    });

    const rechazo = await editarPoliza(id, { primaTotal: '600.00' }).expect(422);
    expect(rechazo.body.details).toEqual({
      campo: 'primaTotal',
      motivo: 'PRIMA_CON_PAGOS_VALIDADOS',
    });

    const detalle = await conSesion('get', `/api/v1/polizas/${id}`).expect(200);
    expect(detalle.body.tienePagosValidados).toBe(true);

    const otra = await editarPoliza(id, { fechaFin: '2027-12-31' }).expect(200);
    expect(otra.body.fechaFin).toBe('2027-12-31');
  });

  it('cancela, bloquea cambios posteriores y lo audita (HU-13.1, D12)', async () => {
    const clienteId = await clienteNuevo();
    const creada = await crearPoliza(clienteId).expect(201);
    const id = creada.body.id as string;

    const cancelada = await cambiarEstado(id, 'CANCELADA').expect(200);
    expect(cancelada.body.estado).toBe('CANCELADA');

    const otraVez = await cambiarEstado(id, 'VENCIDA').expect(422);
    expect(otraVez.body.details).toEqual({ campo: 'estado', motivo: 'POLIZA_NO_VIGENTE' });

    const patch = await editarPoliza(id, { primaTotal: '300.00' }).expect(422);
    expect(patch.body.details).toEqual({ campo: 'estado', motivo: 'POLIZA_NO_VIGENTE' });

    const fila = await prisma.bitacoraAuditoria.findFirstOrThrow({
      where: { accion: 'CAMBIAR_ESTADO', entidad: 'Poliza', entidadId: id },
      orderBy: { creadoEn: 'desc' },
    });
    expect(fila.detalle).toMatchObject({ estado: 'CANCELADA' });
  });

  it('DELETE /polizas/:id ya no existe (D13, RN-09)', async () => {
    const clienteId = await clienteNuevo();
    const creada = await crearPoliza(clienteId).expect(201);

    await conSesion('delete', `/api/v1/polizas/${creada.body.id as string}`).expect(404);
  });

  it('filtra por cliente, aseguradora y estado; ordena por vigencia y pagina (HU-14)', async () => {
    const clienteId = await clienteNuevo();
    const marca = `POL-FILTRO-${sufijo}`;
    const primera = await crearPoliza(clienteId, {
      numero: `${marca}-1`,
      fechaFin: '2027-03-31',
    }).expect(201);
    await crearPoliza(clienteId, { numero: `${marca}-2`, fechaFin: '2027-01-31' }).expect(201);
    await crearPoliza(clienteId, { numero: `${marca}-3`, fechaFin: '2027-06-30' }).expect(201);
    await cambiarEstado(primera.body.id as string, 'CANCELADA').expect(200);

    const porCliente = await listarPolizas({ q: marca, clienteId }).expect(200);
    expect(porCliente.body.meta.total).toBe(3);

    const porAseguradora = await listarPolizas({ q: marca, aseguradoraId }).expect(200);
    expect(porAseguradora.body.meta.total).toBe(3);

    const canceladas = await listarPolizas({ q: marca, estado: 'CANCELADA' }).expect(200);
    expect(canceladas.body.data.map((poliza: { numero: string }) => poliza.numero)).toEqual([
      `${marca}-1`,
    ]);

    const ascendente = await listarPolizas({
      q: marca,
      orden: 'fechaFinAsc',
      pageSize: 50,
    }).expect(200);
    expect(ascendente.body.data.map((poliza: { numero: string }) => poliza.numero)).toEqual([
      `${marca}-2`,
      `${marca}-1`,
      `${marca}-3`,
    ]);

    const descendente = await listarPolizas({
      q: marca,
      orden: 'fechaFinDesc',
      pageSize: 50,
    }).expect(200);
    expect(descendente.body.data.map((poliza: { numero: string }) => poliza.numero)).toEqual([
      `${marca}-3`,
      `${marca}-1`,
      `${marca}-2`,
    ]);

    const pagina1 = await listarPolizas({
      q: marca,
      orden: 'fechaFinAsc',
      page: 1,
      pageSize: 2,
    }).expect(200);
    expect(pagina1.body.data).toHaveLength(2);
    expect(pagina1.body.meta).toMatchObject({ page: 1, pageSize: 2, total: 3, totalPages: 2 });

    const pagina2 = await listarPolizas({
      q: marca,
      orden: 'fechaFinAsc',
      page: 2,
      pageSize: 2,
    }).expect(200);
    expect(pagina2.body.data).toHaveLength(1);
  });
});
