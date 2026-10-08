import { Controller, Get } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';

import { Roles } from '../../../../common/auth/decorators';
import { ListarRamosUseCase } from '../../application/use-cases/polizas.use-cases';

@ApiTags('ramos')
@Controller('ramos')
@Roles('ADMIN', 'OPERADOR')
export class RamosController {
  constructor(private readonly listarRamos: ListarRamosUseCase) {}

  @Get()
  @ApiOperation({ summary: 'Lista los ramos activos del catálogo (D10)' })
  async listar() {
    return this.listarRamos.ejecutar();
  }
}
