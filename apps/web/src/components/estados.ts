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

const EN_PROCESO: Presentacion = { tono: 'proceso', icono: Hourglass, texto: 'En proceso' };
const ANULADO: Presentacion = { tono: 'neutro', icono: Ban, texto: 'Anulado' };
const VENCIDA: Presentacion = { tono: 'error', icono: CalendarX, texto: 'Vencida' };

/**
 * Vocabulario único de estados (The Three Signals Rule). El tipo exige cada estado de las
 * constantes de `@oasis/shared`: si el contrato suma uno, el typecheck falla aquí.
 */
export const ESTADOS: { [D in Dominio]: Record<EstadoDe<D>, Presentacion> } = {
  pago: {
    REGISTRADO: { tono: 'proceso', icono: Clock, texto: 'Por validar' },
    VALIDADO: { tono: 'exito', icono: CircleCheck, texto: 'Validado' },
    RECHAZADO: { tono: 'error', icono: CircleX, texto: 'Rechazado' },
  },
  recibo: {
    PENDIENTE_ANCLAJE: EN_PROCESO,
    ENVIADO: EN_PROCESO,
    ANCLADO: { tono: 'exito', icono: ShieldCheck, texto: 'Verificable' },
    FALLIDO: { tono: 'aviso', icono: TriangleAlert, texto: 'Requiere atención' },
    ANULADO,
  },
  poliza: {
    VIGENTE: { tono: 'exito', icono: CircleCheck, texto: 'Vigente' },
    VENCIDA,
    CANCELADA: { tono: 'neutro', icono: Ban, texto: 'Cancelada' },
    EN_MORA: { tono: 'error', icono: CircleAlert, texto: 'En mora' },
  },
  cliente: {
    ACTIVO: { tono: 'exito', icono: UserCheck, texto: 'Activo' },
    DESACTIVADO: { tono: 'neutro', icono: UserX, texto: 'Desactivado' },
  },
  verificacion: {
    VALIDO: { tono: 'exito', icono: ShieldCheck, texto: 'Auténtico' },
    HASH_INCONSISTENTE: { tono: 'error', icono: ShieldX, texto: 'No coincide' },
    NO_ANCLADO: EN_PROCESO,
    ANULADO,
    NO_ENCONTRADO: { tono: 'error', icono: SearchX, texto: 'No encontrado' },
  },
  cuota: {
    PENDIENTE: { tono: 'neutro', icono: CircleDashed, texto: 'Pendiente' },
    PARCIAL: { tono: 'aviso', icono: CircleDotDashed, texto: 'Pago parcial' },
    PAGADA: { tono: 'exito', icono: CircleCheck, texto: 'Pagada' },
    VENCIDA,
  },
  cuenta: {
    ACTIVA: { tono: 'exito', icono: UserCheck, texto: 'Activa' },
    DESACTIVADA: { tono: 'neutro', icono: UserX, texto: 'Desactivada' },
  },
};

export function presentacionDe<D extends Dominio>(dominio: D, estado: EstadoDe<D>): Presentacion {
  return ESTADOS[dominio][estado];
}
