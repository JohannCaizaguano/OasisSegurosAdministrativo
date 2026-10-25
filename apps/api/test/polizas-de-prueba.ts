import { randomUUID } from 'node:crypto';

import type { PrismaService } from '../src/infrastructure/prisma/prisma.service';

const aFecha = (fecha: string) => new Date(`${fecha}T00:00:00.000Z`);

/**
 * Póliza VIGENTE propia de una prueba (D22), del cliente del seed (dueño de `cliente@oasis.com`) y
 * con su cuota única como la crea el API (D11): la póliza del seed no se altera y su saldo no se
 * agota entre corridas por RN-02.
 */
export async function crearPolizaDePrueba(
  prisma: PrismaService,
  opciones: { prima?: string; fechaInicio?: string; fechaFin?: string } = {},
): Promise<string> {
  const { prima = '1000.00', fechaInicio = '2026-01-01', fechaFin = '2026-12-31' } = opciones;
  const { clienteId } = await prisma.usuario.findUniqueOrThrow({
    where: { email: 'cliente@oasis.com' },
    select: { clienteId: true },
  });
  const aseguradora = await prisma.aseguradora.findFirstOrThrow();
  const ramo = await prisma.ramo.findUniqueOrThrow({ where: { codigo: 'VEHICULOS' } });
  const poliza = await prisma.poliza.create({
    data: {
      numero: `POL-E2E-${randomUUID().slice(0, 8)}`,
      clienteId: clienteId as string,
      aseguradoraId: aseguradora.id,
      ramoId: ramo.id,
      primaTotal: prima,
      fechaInicio: aFecha(fechaInicio),
      fechaFin: aFecha(fechaFin),
      cuotas: { create: { numero: 1, valor: prima, fechaVencimiento: aFecha(fechaInicio) } },
    },
  });
  return poliza.id;
}
