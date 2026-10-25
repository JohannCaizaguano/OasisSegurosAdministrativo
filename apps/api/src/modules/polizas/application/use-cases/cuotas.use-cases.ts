import type { Cuota } from '@oasis/shared';

import { NoEncontradoError } from '../../../../shared-kernel/domain-error';
import { planConPagosValidados, polizaNoVigente } from '../../domain/errores';
import { type CuotaDelPlan, PlanCuotas } from '../../domain/plan-cuotas';
import type { PolizasRepositoryPort } from '../ports/polizas.repository.port';

export class ObtenerPlanCuotasUseCase {
  constructor(private readonly polizas: PolizasRepositoryPort) {}

  async ejecutar(polizaId: string): Promise<Cuota[]> {
    if (!(await this.polizas.buscarPorId(polizaId))) {
      throw new NoEncontradoError('Póliza', polizaId);
    }
    return this.polizas.listarCuotas(polizaId);
  }
}

export class DefinirPlanCuotasUseCase {
  constructor(private readonly polizas: PolizasRepositoryPort) {}

  /** HU-35 (D11): reemplaza el plan completo de una póliza VIGENTE sin pagos validados. */
  async ejecutar(polizaId: string, cuotas: CuotaDelPlan[]): Promise<Cuota[]> {
    const poliza = await this.polizas.buscarPorId(polizaId);
    if (!poliza) {
      throw new NoEncontradoError('Póliza', polizaId);
    }
    if (poliza.estado !== 'VIGENTE') {
      throw polizaNoVigente('Solo una póliza vigente puede cambiar su plan de cuotas');
    }
    if (poliza.tienePagosValidados) {
      throw planConPagosValidados();
    }
    PlanCuotas.de(cuotas).validarContra(poliza);
    return this.polizas.reemplazarCuotas(polizaId, cuotas);
  }
}
