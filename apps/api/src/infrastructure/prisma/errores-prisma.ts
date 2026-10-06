import { Prisma } from '../../generated/prisma/client';

/** Traduce el P2002 de Prisma (índice único) al ConflictoError de dominio (D10). */
export function esConflictoUnico(error: unknown): boolean {
  return error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002';
}
