import { hash } from 'argon2';
import { config as cargarEnv } from 'dotenv';
import { PrismaPg } from '@prisma/adapter-pg';
import {
  aCentavos,
  aMonto,
  aplicarPagoACuotas,
  fechaEnGuayaquil,
  proponerPlanCuotas,
  sumarMesesRecortando,
  type CuotaAplicable,
} from '@oasis/shared';

import { Prisma, PrismaClient } from '../src/generated/prisma/client';
import {
  serializarCanonico,
  type PayloadRecibo,
} from '../src/modules/recibos/domain/payload-recibo';
import { ViemHasherRecibosAdapter } from '../src/modules/recibos/infrastructure/blockchain/viem-hasher-recibos.adapter';
import { NodeCriptoAdapter } from '../src/modules/recibos/infrastructure/crypto/node-cripto.adapter';

cargarEnv({ path: ['.env', '../../.env'], quiet: true });

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error('Falta DATABASE_URL para ejecutar el seed');
}

const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString }) });

const NODE_ENV = process.env.NODE_ENV ?? 'development';

/** Lee una variable de entorno tratando la cadena vacía como ausente. */
function leerTexto(variable: string): string | undefined {
  const valor = process.env[variable];
  return valor !== undefined && valor.trim().length > 0 ? valor.trim() : undefined;
}

const ADMIN_EMAIL = leerTexto('SEED_ADMIN_EMAIL') ?? 'admin@oasis.com';

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
  const valor = leerTexto(variable);
  const porDefecto: string = CLAVES_POR_DEFECTO[variable];
  if (NODE_ENV === 'production' && (valor === undefined || valor === porDefecto)) {
    throw new Error(
      `El seed no puede ejecutarse en producción con la contraseña por defecto: ` +
        `defina ${variable} con un valor distinto de "${porDefecto}"`,
    );
  }
  return valor ?? porDefecto;
}

// D18: los mismos códigos que siembra la migración `cobertura_ramos_s5`.
const RAMOS = [
  { codigo: 'VIDA', nombre: 'Vida' },
  { codigo: 'ASISTENCIA_MEDICA', nombre: 'Asistencia médica' },
  { codigo: 'VEHICULOS', nombre: 'Vehículos' },
  { codigo: 'EQUIPOS_ELECTRONICOS', nombre: 'Equipos electrónicos' },
  { codigo: 'AEREO_DRONES', nombre: 'Aéreo (drones)' },
  { codigo: 'EQUIPOS_MAQUINARIA', nombre: 'Equipos y maquinaria' },
] as const;

const METODOS_PAGO = [
  { codigo: 'DEBITO_BANCARIO', nombre: 'Débito bancario' },
  { codigo: 'TRANSFERENCIA', nombre: 'Transferencia' },
  { codigo: 'DEPOSITO', nombre: 'Depósito' },
  { codigo: 'EFECTIVO', nombre: 'Efectivo' },
  { codigo: 'TARJETA', nombre: 'Tarjeta' },
] as const;

// El ABI pensado para el contenedor de recibos: la verificación recalcula el hash con el
// mismo adaptador que usa el API, así un recibo sembrado se verifica igual que uno emitido.
const cripto = new NodeCriptoAdapter();
const hasher = new ViemHasherRecibosAdapter();
const CHAIN_ID = Number(leerTexto('CHAIN_ID') ?? '31337');
const CONTRACT_ADDRESS = leerTexto('CONTRACT_ADDRESS');

const HOY = fechaEnGuayaquil(new Date());
const PRIMER_DIA_DEL_MES = `${HOY.slice(0, 7)}-01`;

const aFecha = (iso: string) => new Date(`${iso}T00:00:00.000Z`);

/** Primer día del mes `mesesAtras` meses atrás, con el día indicado. */
function mesAtras(mesesAtras: number, dia = 1): string {
  return `${sumarMesesRecortando(PRIMER_DIA_DEL_MES, -mesesAtras).slice(0, 8)}${String(dia).padStart(2, '0')}`;
}

function haceDias(dias: number): string {
  return fechaEnGuayaquil(new Date(Date.now() - dias * 86_400_000));
}

/** Un año de vigencia menos un día, como lo calcula el alta de pólizas. */
function finDeAnio(inicio: string): string {
  const fin = aFecha(sumarMesesRecortando(inicio, 12));
  fin.setUTCDate(fin.getUTCDate() - 1);
  return fin.toISOString().slice(0, 10);
}

interface ClienteSemilla {
  tipoIdentificacion: 'CEDULA' | 'RUC';
  identificacion: string;
  nombres?: string;
  apellidos?: string;
  razonSocial?: string;
  email: string;
  telefono?: string;
}

const CLIENTES: ClienteSemilla[] = [
  {
    tipoIdentificacion: 'CEDULA',
    identificacion: '1710034065',
    nombres: 'María Fernanda',
    apellidos: 'Cabrera Rosero',
    email: 'maria.cabrera@correo.ec',
    telefono: '+593998124410',
  },
  {
    tipoIdentificacion: 'CEDULA',
    identificacion: '1708456783',
    nombres: 'Carlos Andrés',
    apellidos: 'Villacís Mora',
    email: 'carlos.villacis@correo.ec',
    telefono: '+593987654321',
  },
  {
    tipoIdentificacion: 'RUC',
    identificacion: '1792345678001',
    razonSocial: 'Inversiones Andinas S.A.',
    email: 'compras@inversionesandinas.com.ec',
    telefono: '+593225551234',
  },
  {
    tipoIdentificacion: 'CEDULA',
    identificacion: '1712345675',
    nombres: 'Lucía Belén',
    apellidos: 'Paredes Chávez',
    email: 'lucia.paredes@correo.ec',
    telefono: '+593984455667',
  },
];

const ASEGURADORAS = [
  { ruc: '1790012345001', nombre: 'Aseguradora del Pacífico C.A.' },
  { ruc: '1790085783001', nombre: 'Seguros Equinoccial C.A.' },
  { ruc: '1791251237001', nombre: 'MAPFRE Atlas C.A.' },
];

type EstadoPagoSemilla = 'REGISTRADO' | 'VALIDADO' | 'RECHAZADO';

interface PagoSemilla {
  referencia: string;
  monto: string;
  fechaPago: string;
  metodo: 'TRANSFERENCIA' | 'DEPOSITO' | 'EFECTIVO' | 'TARJETA' | 'DEBITO_BANCARIO';
  estado: EstadoPagoSemilla;
  motivoRechazo?: string;
  nota?: string;
  /** HU-17: el cliente reportó el pago con su comprobante. */
  reportadoPorCliente?: boolean;
}

interface PolizaSemilla {
  numero: string;
  cliente: string;
  aseguradora: string;
  ramo: string;
  prima: string;
  cuotas: number;
  inicio: string;
  fin: string;
  estado: 'VIGENTE' | 'VENCIDA' | 'CANCELADA';
  cobertura: string;
  condiciones: string;
  pagos: PagoSemilla[];
}

/**
 * Cartera de demostración: cada póliza cuenta una situación distinta (al día, con cuotas
 * vencidas, con un pago reportado por validar, con un rechazo, vencida y cancelada) para que
 * cartera, pagos y recibos tengan algo real que mostrar.
 */
const POLIZAS: PolizaSemilla[] = [
  {
    numero: 'VEH-2026-01127',
    cliente: '1710034065',
    aseguradora: '1790012345001',
    ramo: 'VEHICULOS',
    prima: '1036.80',
    cuotas: 12,
    inicio: mesAtras(2),
    fin: finDeAnio(mesAtras(2)),
    estado: 'VIGENTE',
    cobertura: 'Daños materiales, responsabilidad civil y robo total\nAsistencia vial 24/7',
    condiciones: 'Deducible del 10 % en daños; franquicia de USD 200 en robo.',
    pagos: [
      {
        referencia: 'TRF-004390551',
        monto: '86.40',
        fechaPago: mesAtras(2, 3),
        metodo: 'TRANSFERENCIA',
        estado: 'VALIDADO',
        nota: 'Transferencia verificada en el estado de cuenta.',
      },
      {
        referencia: 'TRF-004447210',
        monto: '86.40',
        fechaPago: mesAtras(1, 2),
        metodo: 'TRANSFERENCIA',
        estado: 'VALIDADO',
      },
      {
        referencia: 'TRF-004518772',
        monto: '86.40',
        fechaPago: haceDias(1),
        metodo: 'TRANSFERENCIA',
        estado: 'REGISTRADO',
        reportadoPorCliente: true,
      },
    ],
  },
  {
    numero: 'VID-2026-00052',
    cliente: '1710034065',
    aseguradora: '1790085783001',
    ramo: 'VIDA',
    prima: '510.00',
    cuotas: 12,
    inicio: mesAtras(5),
    fin: finDeAnio(mesAtras(5)),
    estado: 'VIGENTE',
    cobertura: 'Muerte por cualquier causa y anticipo por enfermedad grave',
    condiciones: 'Carencia de 90 días para enfermedad grave.',
    pagos: [
      {
        referencia: 'SU-260614-0388',
        monto: '42.50',
        fechaPago: mesAtras(5, 3),
        metodo: 'DEBITO_BANCARIO',
        estado: 'VALIDADO',
        nota: 'Débito bancario del archivo mensual de la aseguradora.',
      },
      {
        referencia: 'SU-260714-0421',
        monto: '42.50',
        fechaPago: mesAtras(4, 3),
        metodo: 'DEBITO_BANCARIO',
        estado: 'VALIDADO',
      },
    ],
  },
  {
    numero: 'EQP-2026-00318',
    cliente: '1792345678001',
    aseguradora: '1790085783001',
    ramo: 'EQUIPOS_ELECTRONICOS',
    prima: '2450.00',
    cuotas: 4,
    inicio: mesAtras(1),
    fin: finDeAnio(mesAtras(1)),
    estado: 'VIGENTE',
    cobertura: 'Rotura accidental y hurto de equipos electrónicos',
    condiciones: 'Cobertura en las oficinas declaradas; deducible del 5 %.',
    pagos: [
      {
        referencia: 'DEP-882314',
        monto: '612.50',
        fechaPago: haceDias(6),
        metodo: 'DEPOSITO',
        estado: 'RECHAZADO',
        motivoRechazo: 'El comprobante no coincide con el monto depositado.',
      },
      {
        referencia: 'TRF-AND-1187',
        monto: '612.50',
        fechaPago: haceDias(1),
        metodo: 'TRANSFERENCIA',
        estado: 'REGISTRADO',
      },
    ],
  },
  {
    numero: 'VEH-2025-00744',
    cliente: '1708456783',
    aseguradora: '1791251237001',
    ramo: 'VEHICULOS',
    prima: '780.00',
    cuotas: 4,
    inicio: mesAtras(14),
    fin: finDeAnio(mesAtras(14)),
    estado: 'VENCIDA',
    cobertura: 'Daños materiales y responsabilidad civil',
    condiciones: 'Deducible del 10 %; póliza no renovada.',
    pagos: [
      {
        referencia: 'TRF-778120',
        monto: '195.00',
        fechaPago: mesAtras(14, 2),
        metodo: 'TRANSFERENCIA',
        estado: 'VALIDADO',
      },
      {
        referencia: 'TRF-781455',
        monto: '195.00',
        fechaPago: mesAtras(13, 5),
        metodo: 'TRANSFERENCIA',
        estado: 'VALIDADO',
      },
    ],
  },
  {
    numero: 'ASM-2026-00045',
    cliente: '1712345675',
    aseguradora: '1790012345001',
    ramo: 'ASISTENCIA_MEDICA',
    prima: '245.00',
    cuotas: 1,
    inicio: PRIMER_DIA_DEL_MES,
    fin: finDeAnio(PRIMER_DIA_DEL_MES),
    estado: 'VIGENTE',
    cobertura: 'Consulta médica, emergencias y hospitalización',
    condiciones: 'Red de clínicas en Quito y Guayaquil; copago del 20 %.',
    pagos: [
      {
        referencia: 'TAR-5541-0092',
        monto: '245.00',
        fechaPago: haceDias(3),
        metodo: 'TARJETA',
        estado: 'VALIDADO',
      },
    ],
  },
  {
    numero: 'VEH-2025-00421',
    cliente: '1708456783',
    aseguradora: '1791251237001',
    ramo: 'VEHICULOS',
    prima: '640.00',
    cuotas: 1,
    inicio: mesAtras(18),
    fin: finDeAnio(mesAtras(18)),
    estado: 'CANCELADA',
    cobertura: 'Daños materiales y robo',
    condiciones: 'Cancelada por cambio de vehículo; sin devolución de prima.',
    pagos: [
      {
        referencia: 'DEP-771903',
        monto: '640.00',
        fechaPago: mesAtras(17, 8),
        metodo: 'DEPOSITO',
        estado: 'RECHAZADO',
        motivoRechazo: 'Depósito no identificado en el estado de cuenta de la aseguradora.',
      },
    ],
  },
];

async function sembrarCatalogo(): Promise<void> {
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
  for (const aseguradora of ASEGURADORAS) {
    await prisma.aseguradora.upsert({
      where: { ruc: aseguradora.ruc },
      update: { nombre: aseguradora.nombre },
      create: aseguradora,
    });
  }
}

async function sembrarCliente(datos: ClienteSemilla) {
  const campos = {
    nombres: datos.nombres ?? null,
    apellidos: datos.apellidos ?? null,
    razonSocial: datos.razonSocial ?? null,
    email: datos.email,
    telefono: datos.telefono ?? null,
  };
  return prisma.cliente.upsert({
    where: { identificacion: datos.identificacion },
    update: campos,
    create: {
      tipoIdentificacion: datos.tipoIdentificacion,
      identificacion: datos.identificacion,
      ...campos,
    },
  });
}

async function sembrarPoliza(
  datos: PolizaSemilla,
  clienteId: string,
  aseguradoraId: string,
  ramoId: string,
) {
  const existente = await prisma.poliza.findUnique({ where: { numero: datos.numero } });
  if (existente) return existente;

  // D12: mismo plan que propone el API, con las cuotas vencidas ya marcadas como el cron.
  const plan = proponerPlanCuotas(datos.prima, datos.cuotas, datos.inicio);
  return prisma.poliza.create({
    data: {
      numero: datos.numero,
      clienteId,
      aseguradoraId,
      ramoId,
      primaTotal: datos.prima,
      fechaInicio: aFecha(datos.inicio),
      fechaFin: aFecha(datos.fin),
      estado: datos.estado,
      cobertura: datos.cobertura,
      condiciones: datos.condiciones,
      cuotas: {
        create: plan.map((cuota) => ({
          numero: cuota.numero,
          valor: cuota.valor,
          fechaVencimiento: aFecha(cuota.fechaVencimiento),
          estado: cuota.fechaVencimiento < HOY ? 'VENCIDA' : 'PENDIENTE',
        })),
      },
    },
  });
}

/** HU-36 (D11): reparte el pago entre las cuotas pendientes, igual que `ValidarPagoUseCase`. */
async function aplicarPago(
  tx: Prisma.TransactionClient,
  pagoId: string,
  polizaId: string,
  monto: string,
): Promise<void> {
  const cuotas = await tx.cuota.findMany({ where: { polizaId } });
  const aplicables: CuotaAplicable[] = cuotas.map((cuota) => ({
    id: cuota.id,
    numero: cuota.numero,
    valor: cuota.valor.toFixed(2),
    valorPagado: cuota.valorPagado.toFixed(2),
    fechaVencimiento: cuota.fechaVencimiento.toISOString().slice(0, 10),
    estado: cuota.estado,
  }));

  const resultado = aplicarPagoACuotas(aplicables, monto, HOY);
  await tx.aplicacionPago.createMany({
    data: resultado.aplicaciones.map((aplicacion) => ({ pagoId, ...aplicacion })),
  });
  for (const cuota of resultado.cuotas) {
    await tx.cuota.update({
      where: { id: cuota.id },
      data: { valorPagado: cuota.valorPagado, estado: cuota.estado },
    });
  }
}

/** Recibo PENDIENTE_ANCLAJE: el worker lo ancla al arrancar con `pnpm dev`. */
async function crearRecibo(
  tx: Prisma.TransactionClient,
  datos: { pagoId: string; numeroPoliza: string; monto: string; fechaPago: string },
): Promise<void> {
  if (!CONTRACT_ADDRESS) return;

  const id = cripto.generarId();
  const codigo = cripto.generarCodigo();
  const sal = cripto.generarSal();
  const emitidoEn = new Date(`${datos.fechaPago}T15:20:00.000Z`).toISOString();
  const payload: PayloadRecibo = {
    codigo,
    pagoId: datos.pagoId,
    numeroPoliza: datos.numeroPoliza,
    monto: datos.monto,
    moneda: 'USD',
    fechaPago: datos.fechaPago,
    emitidoEn,
  };
  const payloadCanonico = serializarCanonico(payload);
  const hashRecibo = hasher.hashRecibo(payloadCanonico, sal);

  await tx.recibo.create({
    data: {
      id,
      codigo,
      pagoId: datos.pagoId,
      idOnchain: hasher.hashTexto(id),
      hashRecibo: hashRecibo.hash,
      sal: hashRecibo.sal,
      payloadCanonico,
      chainId: CHAIN_ID,
      contractAddress: CONTRACT_ADDRESS,
      creadoEn: new Date(emitidoEn),
    },
  });
}

async function sembrarPagos(
  poliza: { id: string; numero: string },
  pagos: PagoSemilla[],
  usuarioOperadorId: string,
  usuarioClienteId: string,
): Promise<void> {
  for (const datos of pagos) {
    const existente = await prisma.pago.findUnique({
      where: {
        polizaId_referencia: { polizaId: poliza.id, referencia: datos.referencia },
      },
    });
    if (existente) continue;

    const metodo = await prisma.metodoPago.findUniqueOrThrow({
      where: { codigo: datos.metodo },
    });
    // Sin contrato desplegado no se puede emitir recibo: el pago queda por validar.
    const validado = datos.estado === 'VALIDADO' && Boolean(CONTRACT_ADDRESS);
    const estado: EstadoPagoSemilla =
      datos.estado === 'VALIDADO' && !validado ? 'REGISTRADO' : datos.estado;
    const validadoEn = validado ? new Date(`${datos.fechaPago}T15:20:00.000Z`) : null;
    const rechazadoEn =
      estado === 'RECHAZADO' ? new Date(`${datos.fechaPago}T16:40:00.000Z`) : null;

    await prisma.$transaction(async (tx) => {
      const pago = await tx.pago.create({
        data: {
          polizaId: poliza.id,
          monto: datos.monto,
          fechaPago: aFecha(datos.fechaPago),
          metodoPagoId: metodo.id,
          referencia: datos.referencia,
          estado,
          registradoPorId: datos.reportadoPorCliente ? usuarioClienteId : usuarioOperadorId,
          validadoPorId: validado ? usuarioOperadorId : null,
          validadoEn,
          rechazadoPorId: estado === 'RECHAZADO' ? usuarioOperadorId : null,
          rechazadoEn,
          motivoRechazo: estado === 'RECHAZADO' ? (datos.motivoRechazo ?? null) : null,
          nota: datos.nota ?? null,
        },
      });
      if (validado) {
        await aplicarPago(tx, pago.id, poliza.id, datos.monto);
        await crearRecibo(tx, {
          pagoId: pago.id,
          numeroPoliza: poliza.numero,
          monto: datos.monto,
          fechaPago: datos.fechaPago,
        });
      }
    });
  }
}

/** HU-45: unas pocas entradas para que la bitácora no arranque vacía en la demo. */
async function sembrarBitacora(ids: {
  adminId: string;
  operadorId: string;
  clienteId: string;
  primerPagoValidadoId?: string;
  pagoRechazadoId?: string;
}): Promise<void> {
  if ((await prisma.bitacoraAuditoria.count()) > 0) return;

  await prisma.bitacoraAuditoria.createMany({
    data: [
      {
        usuarioId: ids.operadorId,
        accion: 'INICIAR_SESION',
        entidad: 'Usuario',
        entidadId: ids.operadorId,
        ip: '190.95.7.21',
        detalle: { email: 'operador@oasis.com' },
      },
      {
        usuarioId: ids.operadorId,
        accion: 'CREAR',
        entidad: 'Cliente',
        entidadId: ids.clienteId,
        ip: '190.95.7.21',
        detalle: { identificacion: '1710034065' },
      },
      ...(ids.primerPagoValidadoId
        ? [
            {
              usuarioId: ids.operadorId,
              accion: 'VALIDAR',
              entidad: 'Pago',
              entidadId: ids.primerPagoValidadoId,
              ip: '190.95.7.21',
              detalle: { monto: '86.40' },
            },
          ]
        : []),
      ...(ids.pagoRechazadoId
        ? [
            {
              usuarioId: ids.operadorId,
              accion: 'RECHAZAR',
              entidad: 'Pago',
              entidadId: ids.pagoRechazadoId,
              ip: '190.95.7.21',
              detalle: { motivo: 'El comprobante no coincide con el monto depositado.' },
            },
          ]
        : []),
      {
        usuarioId: ids.adminId,
        accion: 'INICIAR_SESION',
        entidad: 'Usuario',
        entidadId: ids.adminId,
        ip: '190.95.7.22',
        detalle: { email: ADMIN_EMAIL },
      },
    ],
  });
}

async function main() {
  const admin = await prisma.usuario.upsert({
    where: { email: ADMIN_EMAIL },
    update: {},
    create: {
      email: ADMIN_EMAIL,
      passwordHash: await hash(claveDeSeed('SEED_ADMIN_PASSWORD')),
      nombre: 'Verónica Salazar Ponce',
      rol: 'ADMIN',
    },
  });

  const operador = await prisma.usuario.upsert({
    where: { email: 'operador@oasis.com' },
    update: {},
    create: {
      email: 'operador@oasis.com',
      passwordHash: await hash(claveDeSeed('SEED_OPERADOR_PASSWORD')),
      nombre: 'Diego Andrade Molina',
      rol: 'OPERADOR',
    },
  });

  await sembrarCatalogo();

  const clientes = new Map<string, { id: string }>();
  for (const datos of CLIENTES) {
    const cliente = await sembrarCliente(datos);
    clientes.set(datos.identificacion, cliente);
  }

  const clienteUsuario = await prisma.usuario.upsert({
    where: { email: 'cliente@oasis.com' },
    update: {},
    create: {
      email: 'cliente@oasis.com',
      passwordHash: await hash(claveDeSeed('SEED_CLIENTE_PASSWORD')),
      nombre: 'María Fernanda Cabrera Rosero',
      rol: 'CLIENTE',
      clienteId: clientes.get('1710034065')?.id,
    },
  });

  const aseguradoras = new Map<string, { id: string }>();
  for (const aseguradora of await prisma.aseguradora.findMany()) {
    aseguradoras.set(aseguradora.ruc, aseguradora);
  }
  const ramos = new Map<string, { id: string }>();
  for (const ramo of await prisma.ramo.findMany()) {
    ramos.set(ramo.codigo, ramo);
  }

  let pagosValidados = 0;
  let pagosRechazados = 0;
  let primerPagoValidadoId: string | undefined;
  let pagoRechazadoId: string | undefined;

  for (const datos of POLIZAS) {
    const cliente = clientes.get(datos.cliente);
    const aseguradora = aseguradoras.get(datos.aseguradora);
    const ramo = ramos.get(datos.ramo);
    if (!cliente || !aseguradora || !ramo) {
      throw new Error(`Faltan datos de referencia para la póliza ${datos.numero}`);
    }

    const poliza = await sembrarPoliza(datos, cliente.id, aseguradora.id, ramo.id);
    await sembrarPagos(poliza, datos.pagos, operador.id, clienteUsuario.id);

    const validados = await prisma.pago.findMany({
      where: { polizaId: poliza.id, estado: 'VALIDADO' },
      select: { id: true, monto: true },
      orderBy: { fechaPago: 'asc' },
    });
    pagosValidados += validados.length;
    const rechazados = await prisma.pago.findMany({
      where: { polizaId: poliza.id, estado: 'RECHAZADO' },
      select: { id: true },
    });
    pagosRechazados += rechazados.length;
    primerPagoValidadoId ??= validados[0]?.id;
    pagoRechazadoId ??= rechazados[0]?.id;

    const pagado =
      aCentavos(datos.prima) -
      validados.reduce((total, pago) => total + aCentavos(pago.monto.toFixed(2)), 0);
    console.log(
      `  ${datos.numero}  ${datos.estado.padEnd(9)}  ${datos.cliente}  saldo USD ${aMonto(pagado).padStart(8)}`,
    );
  }

  await sembrarBitacora({
    adminId: admin.id,
    operadorId: operador.id,
    clienteId: clientes.get('1710034065')?.id ?? '',
    primerPagoValidadoId,
    pagoRechazadoId,
  });

  const totalClientes = await prisma.cliente.count();
  const totalPolizas = await prisma.poliza.count();
  const totalRecibos = await prisma.recibo.count();

  console.log('Seed completado:');
  console.log(`  ADMIN     ${ADMIN_EMAIL}     / ${claveDeSeed('SEED_ADMIN_PASSWORD')}`);
  console.log(`  OPERADOR  operador@oasis.com  / ${claveDeSeed('SEED_OPERADOR_PASSWORD')}`);
  console.log(`  CLIENTE   cliente@oasis.com   / ${claveDeSeed('SEED_CLIENTE_PASSWORD')}`);
  console.log(
    `  Catálogo: ${RAMOS.length} ramos, ${METODOS_PAGO.length} métodos, ${ASEGURADORAS.length} aseguradoras`,
  );
  console.log(
    `  Cartera: ${totalClientes} clientes, ${totalPolizas} pólizas, ${pagosValidados} pagos validados, ${pagosRechazados} rechazados, ${totalRecibos} recibos`,
  );
  if (!CONTRACT_ADDRESS) {
    console.warn(
      '  Aviso: CONTRACT_ADDRESS no está definido; los pagos quedaron REGISTRADOS y sin recibo. ' +
        'Ejecuta `pnpm dev:chain` y vuelve a sembrar.',
    );
  }
}

main()
  .catch((error) => {
    console.error('Seed falló:', error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
