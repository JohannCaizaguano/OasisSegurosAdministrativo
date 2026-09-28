import { hash } from 'argon2';
import { config as cargarEnv } from 'dotenv';
import { PrismaPg } from '@prisma/adapter-pg';

import { PrismaClient } from '../src/generated/prisma/client';

cargarEnv({ path: ['.env', '../../.env'], quiet: true });

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error('Falta DATABASE_URL para ejecutar el seed');
}

const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString }) });

const CLAVE_ADMIN = process.env.SEED_ADMIN_PASSWORD ?? 'Admin.Oasis1';
const CLAVE_OPERADOR = process.env.SEED_OPERADOR_PASSWORD ?? 'Operador.Oasis1';
const CLAVE_CLIENTE = process.env.SEED_CLIENTE_PASSWORD ?? 'Cliente.Oasis1';

async function main() {
  const admin = await prisma.usuario.upsert({
    where: { email: 'admin@oasis.com' },
    update: {},
    create: {
      email: 'admin@oasis.com',
      passwordHash: await hash(CLAVE_ADMIN),
      rol: 'ADMIN',
    },
  });

  const aseguradora = await prisma.aseguradora.upsert({
    where: { ruc: '1790012345001' },
    update: {},
    create: { nombre: 'Aseguradora del Pacífico C.A.', ruc: '1790012345001' },
  });

  const cliente = await prisma.cliente.upsert({
    where: { identificacion: '1710034065' },
    update: {
      nombres: 'María Fernanda',
      apellidos: 'Cabrera Rosero',
    },
    create: {
      tipoIdentificacion: 'CEDULA',
      identificacion: '1710034065',
      nombres: 'María Fernanda',
      apellidos: 'Cabrera Rosero',
      email: 'maria.cliente@example.com',
      telefono: '+593999111222',
    },
  });

  await prisma.usuario.upsert({
    where: { email: 'cliente@oasis.com' },
    update: {},
    create: {
      email: 'cliente@oasis.com',
      passwordHash: await hash(CLAVE_CLIENTE),
      rol: 'CLIENTE',
      clienteId: cliente.id,
    },
  });

  await prisma.usuario.upsert({
    where: { email: 'operador@oasis.com' },
    update: {},
    create: {
      email: 'operador@oasis.com',
      passwordHash: await hash(CLAVE_OPERADOR),
      rol: 'OPERADOR',
    },
  });

  const hoy = new Date();
  const fechaInicio = new Date(Date.UTC(hoy.getUTCFullYear(), hoy.getUTCMonth(), 1));
  const fechaFin = new Date(Date.UTC(hoy.getUTCFullYear() + 1, hoy.getUTCMonth(), 0));

  const poliza = await prisma.poliza.upsert({
    where: { numero: 'POL-2026-0001' },
    update: {},
    create: {
      numero: 'POL-2026-0001',
      clienteId: cliente.id,
      aseguradoraId: aseguradora.id,
      ramo: 'Automóviles',
      primaTotal: '480.50',
      fechaInicio,
      fechaFin,
      estado: 'VIGENTE',
    },
  });

  const pagoExistente = await prisma.pago.findFirst({ where: { polizaId: poliza.id } });
  if (!pagoExistente) {
    await prisma.pago.create({
      data: {
        polizaId: poliza.id,
        monto: '120.13',
        fechaPago: hoy,
        metodo: 'TRANSFERENCIA',
        referencia: 'TRF-0001',
        estado: 'REGISTRADO',
      },
    });
  }

  console.log('Seed completado:');
  console.log(`  ADMIN     admin@oasis.com     / ${CLAVE_ADMIN}`);
  console.log(`  OPERADOR  operador@oasis.com  / ${CLAVE_OPERADOR}`);
  console.log(`  CLIENTE   cliente@oasis.com   / ${CLAVE_CLIENTE}`);
  console.log(`  Aseguradora: ${aseguradora.nombre}`);
  console.log(`  Cliente: ${cliente.nombres} ${cliente.apellidos}`);
  console.log(`  Póliza: ${poliza.numero}`);
  console.log(`  Admin usuario: ${admin.email}`);
}

main()
  .catch((error) => {
    console.error('Seed falló:', error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
