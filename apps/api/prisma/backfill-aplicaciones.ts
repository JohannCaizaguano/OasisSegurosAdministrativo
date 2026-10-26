/**
 * D13 (HU-36): aplica a las cuotas los pagos VALIDADOS antes de S5, que no tienen aplicaciones,
 * en orden de `validadoEn` y con la misma regla del API (`aplicarPagoACuotas`). Idempotente: la
 * segunda corrida aplica 0. Uso: `pnpm --filter @oasis/api exec tsx prisma/backfill-aplicaciones.ts`.
 */
import { config as cargarEnv } from 'dotenv';
import { PrismaPg } from '@prisma/adapter-pg';
import { aCentavos, aplicarPagoACuotas, fechaEnGuayaquil } from '@oasis/shared';

import { PrismaClient } from '../src/generated/prisma/client';

cargarEnv({ path: ['.env', '../../.env'], quiet: true });

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error('Falta DATABASE_URL para ejecutar el backfill');
}

const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString }) });

async function main() {
  const hoy = fechaEnGuayaquil(new Date());
  const pagos = await prisma.pago.findMany({
    where: { estado: 'VALIDADO', aplicaciones: { none: {} } },
    select: { id: true, polizaId: true, monto: true },
    orderBy: [{ validadoEn: 'asc' }, { createdAt: 'asc' }],
  });

  let aplicados = 0;
  const omitidos: string[] = [];
  for (const pago of pagos) {
    const monto = pago.monto.toFixed(2);
    const aplicado = await prisma.$transaction(async (tx) => {
      const cuotas = await tx.cuota.findMany({ where: { polizaId: pago.polizaId } });
      const aplicables = cuotas.map((cuota) => ({
        id: cuota.id,
        numero: cuota.numero,
        valor: cuota.valor.toFixed(2),
        valorPagado: cuota.valorPagado.toFixed(2),
        fechaVencimiento: cuota.fechaVencimiento.toISOString().slice(0, 10),
        estado: cuota.estado,
      }));
      const pendiente = aplicables.reduce(
        (total, cuota) => total + aCentavos(cuota.valor) - aCentavos(cuota.valorPagado),
        0,
      );
      if (aCentavos(monto) > pendiente) return false;

      const resultado = aplicarPagoACuotas(aplicables, monto, hoy);
      await tx.aplicacionPago.createMany({
        data: resultado.aplicaciones.map((aplicacion) => ({ pagoId: pago.id, ...aplicacion })),
      });
      for (const cuota of resultado.cuotas) {
        await tx.cuota.update({
          where: { id: cuota.id },
          data: { valorPagado: cuota.valorPagado, estado: cuota.estado },
        });
      }
      return true;
    });
    if (aplicado) aplicados += 1;
    else omitidos.push(pago.id);
  }

  console.log(`Backfill de aplicaciones: ${aplicados} pago(s) aplicado(s).`);
  if (omitidos.length > 0) {
    // Pagos que superan lo pendiente del plan: datos a revisar a mano, no se fuerzan.
    console.warn(`Omitidos por superar lo pendiente de sus cuotas: ${omitidos.join(', ')}`);
  }
}

main()
  .catch((error) => {
    console.error('Backfill falló:', error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
