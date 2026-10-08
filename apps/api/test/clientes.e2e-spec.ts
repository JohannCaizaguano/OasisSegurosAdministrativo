import type { NestExpressApplication } from '@nestjs/platform-express';
import { Test } from '@nestjs/testing';
import cookieParser from 'cookie-parser';
import request from 'supertest';

import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/infrastructure/prisma/prisma.service';
import { cedulaValida, rucSociedad } from './identificaciones';

/**
 * E2E de HU-07 (registro), HU-08 (edición y estado) y HU-09 (búsqueda y paginación)
 * de clientes. Requiere PostgreSQL migrado y el seed cargado.
 */
describe('Clientes (e2e)', () => {
  let app: NestExpressApplication;
  let prisma: PrismaService;
  let tokenOperador: string;
  let aseguradoraId: string;
  let ramoId: string;

  const sufijo = Date.now();
  let contadorIp = 0;

  function ip(): string {
    contadorIp += 1;
    return `198.19.${(contadorIp % 250) + 1}.${(contadorIp % 200) + 1}`;
  }

  function conSesion(metodo: 'get' | 'post' | 'patch', ruta: string) {
    return request(app.getHttpServer())
      [metodo](ruta)
      .set('X-Forwarded-For', ip())
      .set('Authorization', `Bearer ${tokenOperador}`);
  }

  function crearCliente(datos: Record<string, unknown>) {
    return conSesion('post', '/api/v1/clientes').send(datos);
  }

  function listarClientes(query: Record<string, unknown>) {
    return conSesion('get', '/api/v1/clientes').query(query);
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

  it('registra cédula, RUC y pasaporte válidos con su fecha de creación (HU-07.1 y HU-07.4)', async () => {
    const casos = [
      {
        tipoIdentificacion: 'CEDULA',
        identificacion: cedulaValida(sufijo),
        nombres: 'Ana',
        apellidos: 'Pérez',
        email: `cliente.cedula.${sufijo}@example.com`,
      },
      {
        tipoIdentificacion: 'RUC',
        identificacion: rucSociedad(sufijo),
        razonSocial: `Sociedad E2E ${sufijo}`,
        email: `cliente.ruc.${sufijo}@example.com`,
      },
      {
        tipoIdentificacion: 'PASAPORTE',
        identificacion: `E2E${sufijo}`,
        nombres: 'Pas',
        apellidos: 'Porte',
        email: `cliente.pas.${sufijo}@example.com`,
      },
    ];

    for (const datos of casos) {
      const respuesta = await crearCliente(datos).expect(201);
      expect(respuesta.body.identificacion).toBe(datos.identificacion);
      expect(respuesta.body.createdAt).toBeTruthy();
      expect(Number.isNaN(Date.parse(respuesta.body.createdAt as string))).toBe(false);
    }
  });

  it('rechaza una cédula con verificador inválido y un RUC sin 001 (HU-07.1)', async () => {
    const cedula = await crearCliente({
      tipoIdentificacion: 'CEDULA',
      identificacion: '1712345678',
      nombres: 'Ana',
      apellidos: 'Pérez',
      email: `cliente.invalida.${sufijo}@example.com`,
    }).expect(400);
    expect(JSON.stringify(cedula.body.details)).toContain('identificacion');

    const ruc = await crearCliente({
      tipoIdentificacion: 'RUC',
      identificacion: '1790012345002',
      razonSocial: 'Sociedad Inválida',
      email: `cliente.ruc.invalido.${sufijo}@example.com`,
    }).expect(400);
    expect(JSON.stringify(ruc.body.details)).toContain('identificacion');
  });

  it('rechaza una identificación duplicada con un mensaje claro (HU-07.2)', async () => {
    const identificacion = cedulaValida(sufijo + 1);
    const base = {
      tipoIdentificacion: 'CEDULA',
      identificacion,
      nombres: 'Duplicada',
      apellidos: 'Prueba',
    };
    await crearCliente({ ...base, email: `duplicada.1.${sufijo}@example.com` }).expect(201);

    const respuesta = await crearCliente({
      ...base,
      email: `duplicada.2.${sufijo}@example.com`,
    }).expect(409);

    expect(respuesta.body.message).toBe('Ya existe un cliente con esa identificación');
    expect(respuesta.body.details).toEqual({
      campo: 'identificacion',
      motivo: 'IDENTIFICACION_DUPLICADA',
    });
  });

  it('exige nombres con cédula y razón social con RUC (HU-07.3)', async () => {
    const cedula = await crearCliente({
      tipoIdentificacion: 'CEDULA',
      identificacion: cedulaValida(sufijo + 2),
      email: `sin.nombres.${sufijo}@example.com`,
    }).expect(400);
    expect(JSON.stringify(cedula.body.details)).toContain('nombres');

    const ruc = await crearCliente({
      tipoIdentificacion: 'RUC',
      identificacion: rucSociedad(sufijo + 2),
      email: `sin.razon.${sufijo}@example.com`,
    }).expect(400);
    expect(JSON.stringify(ruc.body.details)).toContain('razonSocial');
  });

  it('DELETE /clientes/:id ya no existe (RN-09)', async () => {
    const creado = await crearCliente({
      tipoIdentificacion: 'CEDULA',
      identificacion: cedulaValida(sufijo + 3),
      nombres: 'Sin',
      apellidos: 'Borrado',
      email: `sin.borrado.${sufijo}@example.com`,
    }).expect(201);

    await request(app.getHttpServer())
      .delete(`/api/v1/clientes/${creado.body.id as string}`)
      .set('X-Forwarded-For', ip())
      .set('Authorization', `Bearer ${tokenOperador}`)
      .expect(404);
  });

  it('edita los datos de contacto de un cliente (HU-08.1)', async () => {
    const creado = await crearCliente({
      tipoIdentificacion: 'CEDULA',
      identificacion: cedulaValida(sufijo + 4),
      nombres: 'Edita',
      apellidos: 'Contacto',
      email: `contacto.antes.${sufijo}@example.com`,
    }).expect(201);
    const id = creado.body.id as string;

    const respuesta = await conSesion('patch', `/api/v1/clientes/${id}`)
      .send({ email: `contacto.despues.${sufijo}@example.com`, telefono: '0991234567' })
      .expect(200);

    expect(respuesta.body.email).toBe(`contacto.despues.${sufijo}@example.com`);
    expect(respuesta.body.telefono).toBe('0991234567');
    expect(respuesta.body.tienePolizas).toBe(false);

    const detalle = await conSesion('get', `/api/v1/clientes/${id}`).expect(200);
    expect(detalle.body.email).toBe(`contacto.despues.${sufijo}@example.com`);
    expect(detalle.body.telefono).toBe('0991234567');
  });

  it('no permite cambiar la identificación de un cliente con pólizas (HU-08.2)', async () => {
    const identificacion = cedulaValida(sufijo + 5);
    const creado = await crearCliente({
      tipoIdentificacion: 'CEDULA',
      identificacion,
      nombres: 'Con',
      apellidos: 'Póliza',
      email: `con.poliza.${sufijo}@example.com`,
    }).expect(201);
    const id = creado.body.id as string;

    await conSesion('post', '/api/v1/polizas')
      .send({
        numero: `POL-CLI-${sufijo}`,
        clienteId: id,
        aseguradoraId,
        ramoId,
        primaTotal: '100.00',
        fechaInicio: '2026-11-01',
        fechaFin: '2027-10-31',
      })
      .expect(201);

    const rechazo = await conSesion('patch', `/api/v1/clientes/${id}`)
      .send({ tipoIdentificacion: 'CEDULA', identificacion: cedulaValida(sufijo + 6) })
      .expect(422);
    expect(rechazo.body.details).toEqual({
      campo: 'identificacion',
      motivo: 'IDENTIFICACION_CON_POLIZAS',
    });

    // Reenviar el mismo valor no es un cambio (D5).
    const mismo = await conSesion('patch', `/api/v1/clientes/${id}`)
      .send({ tipoIdentificacion: 'CEDULA', identificacion })
      .expect(200);
    expect(mismo.body.identificacion).toBe(identificacion);
    expect(mismo.body.tienePolizas).toBe(true);
  });

  it('desactiva sin borrar, lo lista por estado y lo reactiva (HU-08.3, HU-09.3)', async () => {
    const identificacion = cedulaValida(sufijo + 7);
    const creado = await crearCliente({
      tipoIdentificacion: 'CEDULA',
      identificacion,
      nombres: 'Estado',
      apellidos: 'Cambiante',
      email: `estado.${sufijo}@example.com`,
    }).expect(201);
    const id = creado.body.id as string;

    const desactivado = await conSesion('post', `/api/v1/clientes/${id}/desactivar`).expect(200);
    expect(desactivado.body.activo).toBe(false);

    const sigue = await conSesion('get', `/api/v1/clientes/${id}`).expect(200);
    expect(sigue.body.activo).toBe(false);

    const porDefecto = await listarClientes({ q: identificacion }).expect(200);
    expect(porDefecto.body.data.map((cliente: { id: string }) => cliente.id)).not.toContain(id);

    const inactivos = await listarClientes({ q: identificacion, estado: 'INACTIVOS' }).expect(200);
    expect(inactivos.body.data.map((cliente: { id: string }) => cliente.id)).toContain(id);

    const todos = await listarClientes({ q: identificacion, estado: 'TODOS' }).expect(200);
    expect(todos.body.data.map((cliente: { id: string }) => cliente.id)).toContain(id);

    const reactivado = await conSesion('post', `/api/v1/clientes/${id}/reactivar`).expect(200);
    expect(reactivado.body.activo).toBe(true);

    const activos = await listarClientes({ q: identificacion }).expect(200);
    expect(activos.body.data.map((cliente: { id: string }) => cliente.id)).toContain(id);
  });

  it('busca por identificación, por nombre y por "nombre apellido" (HU-09.1)', async () => {
    const identificacion = cedulaValida(sufijo + 8);
    const nombres = `Nom${sufijo}`;
    const apellidos = `Ape${sufijo}`;
    const creado = await crearCliente({
      tipoIdentificacion: 'CEDULA',
      identificacion,
      nombres,
      apellidos,
      email: `busqueda.${sufijo}@example.com`,
    }).expect(201);
    const id = creado.body.id as string;

    const porIdentificacion = await listarClientes({ q: identificacion }).expect(200);
    expect(porIdentificacion.body.data.map((cliente: { id: string }) => cliente.id)).toContain(id);

    const porNombre = await listarClientes({ q: nombres }).expect(200);
    expect(porNombre.body.data.map((cliente: { id: string }) => cliente.id)).toContain(id);

    // Dos palabras: cada una debe coincidir; están en columnas distintas.
    const porNombreApellido = await listarClientes({ q: `${nombres} ${apellidos}` }).expect(200);
    expect(porNombreApellido.body.meta.total).toBe(1);
    expect(porNombreApellido.body.data[0].id).toBe(id);
  });

  it('pagina el listado de 20 en 20 (HU-09.2)', async () => {
    const marca = `Pag${sufijo}`;

    for (let indice = 0; indice < 21; indice += 1) {
      await crearCliente({
        tipoIdentificacion: 'CEDULA',
        identificacion: cedulaValida(sufijo + 30 + indice),
        nombres: marca,
        apellidos: `Página ${indice}`,
        email: `pagina.${indice}.${sufijo}@example.com`,
      }).expect(201);
    }

    const primera = await listarClientes({ q: marca, page: 1 }).expect(200);
    expect(primera.body.data).toHaveLength(20);
    expect(primera.body.meta).toMatchObject({ page: 1, pageSize: 20, total: 21, totalPages: 2 });

    const segunda = await listarClientes({ q: marca, page: 2 }).expect(200);
    expect(segunda.body.data).toHaveLength(1);
  });

  it('la bitácora registra DESACTIVAR y REACTIVAR (HU-08.3, HU-45)', async () => {
    const creado = await crearCliente({
      tipoIdentificacion: 'CEDULA',
      identificacion: cedulaValida(sufijo + 9),
      nombres: 'Audita',
      apellidos: 'Estado',
      email: `audita.estado.${sufijo}@example.com`,
    }).expect(201);
    const id = creado.body.id as string;

    await conSesion('post', `/api/v1/clientes/${id}/desactivar`).expect(200);
    await conSesion('post', `/api/v1/clientes/${id}/reactivar`).expect(200);

    const filas = await prisma.bitacoraAuditoria.findMany({
      where: { entidad: 'Cliente', entidadId: id },
    });
    expect(filas.map((fila) => fila.accion)).toEqual(
      expect.arrayContaining(['CREAR', 'DESACTIVAR', 'REACTIVAR']),
    );
  });
});
