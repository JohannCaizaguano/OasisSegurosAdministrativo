import {
  Car,
  Cog,
  Flame,
  FileSignature,
  HeartPulse,
  Laptop,
  Plane,
  Shield,
  Stethoscope,
  type LucideIcon,
} from 'lucide-react';

/** Íconos por código de ramo; importados por nombre para que Vite solo empaquete estos nueve. */
const ICONOS_RAMO: Record<string, LucideIcon> = {
  VIDA: HeartPulse,
  SALUD: Stethoscope,
  ASISTENCIA_MEDICA: Stethoscope,
  VEHICULOS: Car,
  INCENDIO: Flame,
  FIANZAS: FileSignature,
  EQUIPOS_ELECTRONICOS: Laptop,
  AEREO_DRONES: Plane,
  EQUIPOS_MAQUINARIA: Cog,
};

export function iconoDeRamo(codigo: string): { icono: LucideIcon; clave: string } {
  return Object.hasOwn(ICONOS_RAMO, codigo)
    ? { icono: ICONOS_RAMO[codigo], clave: codigo }
    : { icono: Shield, clave: 'GENERICO' };
}
