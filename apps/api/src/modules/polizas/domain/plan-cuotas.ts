import { aCentavos, proponerPlanCuotas, sumarMontos } from '@oasis/shared';

import { planFueraDeVigencia, planNoCuadra } from './errores';

export interface CuotaDelPlan {
  numero: number;
  valor: string;
  fechaVencimiento: string;
}

interface VigenciaYPrima {
  primaTotal: string;
  fechaInicio: string;
  fechaFin: string;
}

/** Plan de cuotas de una póliza (ADR-020). Toda la aritmética va en centavos. */
export class PlanCuotas {
  private constructor(readonly cuotas: readonly CuotaDelPlan[]) {}

  static de(cuotas: readonly CuotaDelPlan[]): PlanCuotas {
    return new PlanCuotas(
      cuotas.map(({ numero, valor, fechaVencimiento }) => ({ numero, valor, fechaVencimiento })),
    );
  }

  /** D11: la suma es la prima (RN-15) y cada vencimiento cae dentro de la vigencia. */
  validarContra(poliza: VigenciaYPrima): void {
    const suma = sumarMontos(this.cuotas.map((c) => c.valor));
    if (aCentavos(suma) !== aCentavos(poliza.primaTotal)) {
      throw planNoCuadra(suma, sumarMontos([poliza.primaTotal]));
    }
    const fuera = this.cuotas.findIndex(
      (c) => c.fechaVencimiento < poliza.fechaInicio || c.fechaVencimiento > poliza.fechaFin,
    );
    if (fuera >= 0) {
      throw planFueraDeVigencia(fuera);
    }
  }

  /**
   * D13: con una cuota, la cuota toma la prima y vence al inicio (pago único); con N, los valores
   * se recalculan con la propuesta mensual y las fechas se conservan.
   */
  recalcularParaPrima(primaNueva: string, fechaInicio: string): PlanCuotas {
    if (this.cuotas.length === 1) {
      return new PlanCuotas([
        { numero: 1, valor: sumarMontos([primaNueva]), fechaVencimiento: fechaInicio },
      ]);
    }
    const valores = proponerPlanCuotas(primaNueva, this.cuotas.length, fechaInicio);
    return new PlanCuotas(this.cuotas.map((c, i) => ({ ...c, valor: valores[i].valor })));
  }
}
