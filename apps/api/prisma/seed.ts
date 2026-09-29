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

const NODE_ENV = process.env.NODE_ENV ?? 'development';
const ADMIN_EMAIL = process.env.SEED_ADMIN_EMAIL ?? 'admin@oasis.com';

const CLAVES_POR_DEFECTO = {
  SEED_ADMIN_PASSWORD: 'Admin.Oasis1',
  SEED_OPERADOR_PASSWORD: 'Operador.Oasis1',
  SEED_CLIENTE_PASSWORD: 'Cliente.Oasis1',
} as const;

/**
 * Devuelve la contraseña de seed y se niega a sembrar en producción con la
 * contraseña por defecto (o sin definirla).
 */
function claveDeSeed(variable: keyof typeof CLAVES_POR_DEFECTO): string {
  const valor = process.env[variable];
  const porDefecto: string = CLAVES_POR_DEFECTO[variable];
  if (NODE_ENV === 'production' && (valor === undefined || valor === porDefecto)) {
    throw new Error(
      `El seed no puede ejecutarse en producción con la contraseña por defecto: ` +
        `defina ${variable} con un valor distinto de "${porDefecto}"`,
    );
  }
  return valor ?? porDefecto;
}

const RAMOS = [
  { codigo: 'VIDA', nombre: 'Vida' },
  { codigo: 'SALUD', nombre: 'Salud' },
  { codigo: 'VEHICULOS', nombre: 'Vehículos' },
  { codigo: 'INCENDIO', nombre: 'Incendio' },
  { codigo: 'FIANZAS', nombre: 'Fianzas' },
] as const;

const METODOS_PAGO = [
  { codigo: 'TRANSFERENCIA', nombre: 'Transferencia' },
  { codigo: 'DEPOSITO', nombre: 'Depósito' },
  { codigo: 'EFECTIVO', nombre: 'Efectivo' },
  { codigo: 'TARJETA', nombre: 'Tarjeta' },
] as const;

async function main() {
  const admin = await prisma.usuario.upsert({
    where: { email: ADMIN_EMAIL },
    update: {},
    create: {
      email: ADMIN_EMAIL,
      passwordHash: await hash(claveDeSeed('SEED_ADMIN_PASSWORD')),
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
      passwordHash: await hash(claveDeSeed('SEED_CLIENTE_PASSWORD')),
      rol: 'CLIENTE',
      clienteId: cliente.id,
    },
  });

  await prisma.usuario.upsert({
    where: { email: 'operador@oasis.com' },
    update: {},
    create: {
      email: 'operador@oasis.com',
      passwordHash: await hash(claveDeSeed('SEED_OPERADOR_PASSWORD')),
      rol: 'OPERADOR',
    },
  });

  // Catálogos: `upsert` por código para que el seed sea idempotente.
  for (const ramo of RAMOS) {
    await prisma.ramo.upsert({
      where: { codigo: ramo.codigo },
      update: { nombre: ramo.nombre },
      create: ramo,
    });
  }
  for (const metodo of METODOS_PAGO) {
    await prisma.metodoPago.upsert({
      where: { codigo: metodo.codigo },
      update: { nombre: metodo.nombre },
      create: metodo,
    });
  }

  const ramoVehiculos = await prisma.ramo.findUniqueOrThrow({ where: { codigo: 'VEHICULOS' } });
  const metodoTransferencia = await prisma.metodoPago.findUniqueOrThrow({
    where: { codigo: 'TRANSFERENCIA' },
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
      ramoId: ramoVehiculos.id,
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
        metodoPagoId: metodoTransferencia.id,
        referencia: 'TRF-0001',
        estado: 'REGISTRADO',
      },
    });
  }

  console.log('Seed completado:');
  console.log(`  ADMIN     ${ADMIN_EMAIL}     / ${claveDeSeed('SEED_ADMIN_PASSWORD')}`);
  console.log(`  OPERADOR  operador@oasis.com  / ${claveDeSeed('SEED_OPERADOR_PASSWORD')}`);
  console.log(`  CLIENTE   cliente@oasis.com   / ${claveDeSeed('SEED_CLIENTE_PASSWORD')}`);
  console.log(`  Aseguradora: ${aseguradora.nombre}`);
  console.log(`  Cliente: ${cliente.nombres} ${cliente.apellidos}`);
  console.log(`  Póliza: ${poliza.numero} (ramo ${ramoVehiculos.nombre})`);
  console.log(`  Ramos: ${RAMOS.map((r) => r.nombre).join(', ')}`);
  console.log(`  Métodos de pago: ${METODOS_PAGO.map((m) => m.nombre).join(', ')}`);
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
