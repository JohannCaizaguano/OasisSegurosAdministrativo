import { Prisma } from '../../generated/prisma/client';

import { esConflictoUnico } from './errores-prisma';

function errorPrisma(code: string) {
  return new Prisma.PrismaClientKnownRequestError('fallo', { code, clientVersion: 'test' });
}

describe('esConflictoUnico', () => {
  it('reconoce el P2002 de un índice único', () => {
    expect(esConflictoUnico(errorPrisma('P2002'))).toBe(true);
  });

  it('no confunde otros errores de Prisma ni errores genéricos', () => {
    expect(esConflictoUnico(errorPrisma('P2025'))).toBe(false);
    expect(esConflictoUnico(new Error('P2002'))).toBe(false);
  });
});
