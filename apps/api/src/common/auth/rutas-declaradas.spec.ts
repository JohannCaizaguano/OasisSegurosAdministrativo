import { Controller, Get, Module, forwardRef } from '@nestjs/common';

import { controladores } from '../../../test/rutas-declaradas';

@Controller('a')
class ControladorA {
  @Get()
  listar(): string[] {
    return [];
  }
}

@Module({ controllers: [ControladorA] })
class ModuloA {}

@Controller('b')
class ControladorB {
  @Get()
  listar(): string[] {
    return [];
  }
}

@Module({ imports: [forwardRef(() => ModuloA)], controllers: [ControladorB] })
class ModuloRaiz {}

describe('controladores (descubrimiento de rutas)', () => {
  it('atraviesa los imports envueltos en forwardRef', () => {
    const encontrados = controladores(ModuloRaiz);

    expect(encontrados).toEqual(expect.arrayContaining([ControladorA, ControladorB]));
  });
});
