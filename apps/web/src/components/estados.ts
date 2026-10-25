import type {
  EstadoCuota,
  EstadoPago,
  EstadoPoliza,
  EstadoRecibo,
  EstadoVerificacion,
} from '@oasis/shared';
import {
  Ban,
  CalendarX,
  CircleAlert,
  CircleCheck,
  CircleDashed,
  CircleDotDashed,
  CircleX,
  Clock,
  Hourglass,
  SearchX,
  ShieldCheck,
  ShieldX,
  TriangleAlert,
  UserCheck,
  UserX,
  type LucideIcon,
} from 'lucide-react';

/** Los cinco tonos de estado de DESIGN.md; cada uno tiene su pareja de tokens texto/fondo. */
export type Tono = 'exito' | 'proceso' | 'aviso' | 'error' | 'neutro';

/** Pareja texto/fondo de cada tono, para la insignia y para cualquier icono de estado. */
export const CLASES_TONO: Record<Tono, string> = {
  exito: 'bg-estado-exito-fondo text-estado-exito',
  proceso: 'bg-estado-proceso-fondo text-estado-proceso',
  aviso: 'bg-estado-aviso-fondo text-estado-aviso',
  error: 'bg-estado-error-fondo text-estado-error',
  neutro: 'bg-estado-neutro-fondo text-estado-neutro',
};

export interface Presentacion {
  tono: Tono;
  icono: LucideIcon;
  texto: string;
  /** Una frase en «usted», sin jerga técnica: la leen la leyenda y el portal. */
  descripcion: string;
}

// El API expone el cliente y la cuenta con un booleano `activo`; la insignia los nombra aquí.
export const ESTADOS_CLIENTE = ['ACTIVO', 'DESACTIVADO'] as const;
export const ESTADOS_CUENTA = ['ACTIVA', 'DESACTIVADA'] as const;

interface EstadosPorDominio {
  pago: EstadoPago;
  recibo: EstadoRecibo;
  /** `EN_MORA` no es un estado de la póliza: se deriva de sus cuotas vencidas (RN-16). */
  poliza: EstadoPoliza | 'EN_MORA';
  cliente: (typeof ESTADOS_CLIENTE)[number];
  verificacion: EstadoVerificacion;
  cuota: EstadoCuota;
  cuenta: (typeof ESTADOS_CUENTA)[number];
}

export type Dominio = keyof EstadosPorDominio;
export type EstadoDe<D extends Dominio> = EstadosPorDominio[D];

const EN_PROCESO: Presentacion = {
  tono: 'proceso',
  icono: Hourglass,
  texto: 'En proceso',
  descripcion:
    'El recibo se está registrando para que pueda verificarse; suele tardar menos de un minuto.',
};
const ANULADO: Presentacion = {
  tono: 'neutro',
  icono: Ban,
  texto: 'Anulado',
  descripcion: 'Oasis Seguros anuló este recibo; ya no vale como comprobante.',
};
const VENCIDA: Presentacion = {
  tono: 'error',
  icono: CalendarX,
  texto: 'Vencida',
  descripcion: 'Pasó su fecha de vencimiento sin cubrirse.',
};

/**
 * Vocabulario único de estados (The Three Signals Rule). El tipo exige cada estado de las
 * constantes de `@oasis/shared`: si el contrato suma uno, el typecheck falla aquí.
 */
export const ESTADOS: { [D in Dominio]: Record<EstadoDe<D>, Presentacion> } = {
  pago: {
    REGISTRADO: {
      tono: 'proceso',
      icono: Clock,
      texto: 'Por validar',
      descripcion:
        'Oasis Seguros está revisando este pago con la notificación de la aseguradora o el comprobante.',
    },
    VALIDADO: {
      tono: 'exito',
      icono: CircleCheck,
      texto: 'Validado',
      descripcion: 'El pago fue confirmado y tiene un recibo verificable.',
    },
    RECHAZADO: {
      tono: 'error',
      icono: CircleX,
      texto: 'Rechazado',
      descripcion: 'El pago no se pudo confirmar; el motivo aparece junto a él.',
    },
  },
  recibo: {
    PENDIENTE_ANCLAJE: EN_PROCESO,
    ENVIADO: EN_PROCESO,
    ANCLADO: {
      tono: 'exito',
      icono: ShieldCheck,
      texto: 'Verificable',
      descripcion: 'Cualquier persona con sesión puede comprobar que el recibo es auténtico.',
    },
    FALLIDO: {
      tono: 'aviso',
      icono: TriangleAlert,
      texto: 'Requiere atención',
      descripcion:
        'No se pudo registrar el recibo; el sistema lo reintenta y, si sigue así, un administrador lo revisa.',
    },
    ANULADO,
  },
  poliza: {
    VIGENTE: {
      tono: 'exito',
      icono: CircleCheck,
      texto: 'Vigente',
      descripcion: 'La póliza está activa y admite pagos.',
    },
    VENCIDA: { ...VENCIDA, descripcion: 'Terminó su vigencia; ya no admite pagos.' },
    CANCELADA: {
      tono: 'neutro',
      icono: Ban,
      texto: 'Cancelada',
      descripcion: 'Se canceló antes de terminar; ya no admite pagos.',
    },
    EN_MORA: {
      tono: 'error',
      icono: CircleAlert,
      texto: 'En mora',
      descripcion: 'Tiene al menos una cuota vencida sin pagar.',
    },
  },
  cliente: {
    ACTIVO: {
      tono: 'exito',
      icono: UserCheck,
      texto: 'Activo',
      descripcion: 'Puede usar el sistema.',
    },
    DESACTIVADO: {
      tono: 'neutro',
      icono: UserX,
      texto: 'Desactivado',
      descripcion: 'No puede iniciar sesión ni operar.',
    },
  },
  verificacion: {
    VALIDO: {
      tono: 'exito',
      icono: ShieldCheck,
      texto: 'Auténtico',
      descripcion: 'El recibo fue emitido por Oasis Seguros y no ha cambiado.',
    },
    HASH_INCONSISTENTE: {
      tono: 'error',
      icono: ShieldX,
      texto: 'No coincide',
      descripcion:
        'Los datos del recibo no son los que se registraron. No lo acepte y comuníquese con Oasis Seguros.',
    },
    NO_ANCLADO: {
      ...EN_PROCESO,
      descripcion: 'El recibo existe y se está registrando. Vuelva a intentarlo en un minuto.',
    },
    ANULADO,
    NO_ENCONTRADO: {
      tono: 'error',
      icono: SearchX,
      texto: 'No encontrado',
      descripcion: 'No hay un recibo con ese código. Revise que lo haya escrito bien.',
    },
  },
  cuota: {
    PENDIENTE: {
      tono: 'neutro',
      icono: CircleDashed,
      texto: 'Pendiente',
      descripcion: 'Aún no vence y no tiene pagos.',
    },
    PARCIAL: {
      tono: 'aviso',
      icono: CircleDotDashed,
      texto: 'Pago parcial',
      descripcion: 'Tiene un abono, pero falta completar su valor.',
    },
    PAGADA: {
      tono: 'exito',
      icono: CircleCheck,
      texto: 'Pagada',
      descripcion: 'Está cubierta por completo.',
    },
    VENCIDA,
  },
  cuenta: {
    ACTIVA: {
      tono: 'exito',
      icono: UserCheck,
      texto: 'Activa',
      descripcion: 'Puede usar el sistema.',
    },
    DESACTIVADA: {
      tono: 'neutro',
      icono: UserX,
      texto: 'Desactivada',
      descripcion: 'No puede iniciar sesión ni operar.',
    },
  },
};

export function presentacionDe<D extends Dominio>(dominio: D, estado: EstadoDe<D>): Presentacion {
  return ESTADOS[dominio][estado];
}
