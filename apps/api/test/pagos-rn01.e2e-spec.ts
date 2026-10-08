import type { NestExpressApplication } from '@nestjs/platform-express';
import { Test } from '@nestjs/testing';
import cookieParser from 'cookie-parser';
import request from 'supertest';

import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/infrastructure/prisma/prisma.service';
import { cedulaValida } from './identificaciones';

/**
 * E2E de RN-01 (HU-13.2): una póliza no vigente no admite pagos nuevos. Cada póliza
 * la crea la prueba (D19); la del seed no se toca. Requiere PostgreSQL con el seed.
 */
describe('RN-01 en el registro de pagos (e2e)', () => {
  let app: NestExpressApplication;
  let prisma: PrismaService;
  let tokenOperador: string;
  let aseguradoraId: string;
  let ramoId: string;

  const sufijo = Date.now();
  let contadorIp = 0;
  let contadorPolizas = 0;

  function ip(): string {
    contadorIp += 1;
    return `198.51.100.${(contadorIp % 250) + 1}`;
  }

  function conSesion(metodo: 'get' | 'post', ruta: string) {
    return request(app.getHttpServer())
      [metodo](ruta)
      .set('X-Forwarded-For', ip())
      .set('Authorization', `Bearer ${tokenOperador}`);
  }

  async function polizaNueva(estado: 'VIGENTE' | 'VENCIDA' | 'CANCELADA'): Promise<string> {
    contadorPolizas += 1;
    const cliente = await conSesion('post', '/api/v1/clientes')
      .send({
        tipoIdentificacion: 'CEDULA',
        identificacion: cedulaValida(sufijo + 700 + contadorPolizas),
        nombres: 'Cliente',
        apellidos: `RN-01 ${contadorPolizas}`,
        email: `rn01.${contadorPolizas}.${sufijo}@example.com`,
      })
      .expect(201);

    const creada = await conSesion('post', '/api/v1/polizas')
      .send({
        numero: `POL-RN01-${sufijo}-${contadorPolizas}`,
        clienteId: cliente.body.id as string,
        aseguradoraId,
        ramoId,
        primaTotal: '300.00',
        fechaInicio: '2026-11-01',
        fechaFin: '2027-10-31',
      })
      .expect(201);

    if (estado !== 'VIGENTE') {
      await conSesion('post', `/api/v1/polizas/${creada.body.id as string}/estado`)
        .send({ estado })
        .expect(200);
    }
    return creada.body.id as string;
  }

  function crearPago(polizaId: string) {
    return conSesion('post', '/api/v1/pagos').send({
      polizaId,
      monto: '25.00',
      fechaPago: new Date().toISOString().slice(0, 10),
      metodo: 'TRANSFERENCIA',
      referencia: `E2E-RN01-${sufijo}`,
    });
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

    const login = await request(app.getHttpServer())
      .post('/api/v1/auth/login')
      .set('X-Forwarded-For', ip())
      .send({ email: 'operador@oasis.com', password: 'Operador.Oasis1' })
      .expect(200);
    tokenOperador = login.body.accessToken as string;
  });

  afterAll(async () => {
    await app?.close();
  });

  it('rechaza un pago sobre una póliza VENCIDA (HU-13.2)', async () => {
    const polizaId = await polizaNueva('VENCIDA');

    const respuesta = await crearPago(polizaId).expect(422);
    expect(respuesta.body.details).toEqual({ campo: 'polizaId', motivo: 'POLIZA_NO_VIGENTE' });
  });

  it('rechaza un pago sobre una póliza CANCELADA (HU-13.2)', async () => {
    const polizaId = await polizaNueva('CANCELADA');

    const respuesta = await crearPago(polizaId).expect(422);
    expect(respuesta.body.details).toEqual({ campo: 'polizaId', motivo: 'POLIZA_NO_VIGENTE' });
  });

  it('responde 404 si la póliza no existe y crea el pago si está VIGENTE', async () => {
    const inexistente = await crearPago('00000000-0000-4000-8000-000000000000').expect(404);
    expect(inexistente.body.code).toBe('NO_ENCONTRADO');

    const polizaId = await polizaNueva('VIGENTE');
    const creado = await crearPago(polizaId).expect(201);
    expect(creado.body.polizaId).toBe(polizaId);
    expect(creado.body.estado).toBe('REGISTRADO');
  });
});
