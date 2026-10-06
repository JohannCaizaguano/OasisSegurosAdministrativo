import type { CambiarContrasenaInput, LoginInput } from '@oasis/shared';
import { AVISO_INACTIVIDAD_MS, INACTIVIDAD_SESION_MS, LATIDO_SESION_MS } from '@oasis/shared';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useCallback, useEffect, useRef, useState } from 'react';

import { useAuthStore, type MotivoCierre } from '@/lib/auth-store';
import { msDesdeUltimaPeticion, refrescarToken } from '@/lib/api-client';

import { authApi } from './api';

const CLAVE_ACTIVIDAD = 'oasis:ultima-actividad';
const CLAVE_CIERRE = 'oasis:sesion-cerrada';
const EVENTOS_ACTIVIDAD = [
  'pointerdown',
  'pointermove',
  'keydown',
  'wheel',
  'touchstart',
  'scroll',
];
/** `pointermove` llega decenas de veces por segundo: la actividad se comparte cada 5 s como mucho. */
const ESCRITURA_ACTIVIDAD_MS = 5_000;

export function useLogin() {
  const establecerSesion = useAuthStore((estado) => estado.establecerSesion);
  return useMutation({
    mutationFn: (datos: LoginInput) => authApi.login(datos),
    onSuccess: establecerSesion,
  });
}

export function useCambiarContrasena() {
  return useMutation({
    mutationFn: (datos: CambiarContrasenaInput) => authApi.cambiarContrasena(datos),
  });
}

/** Con `localStorage` bloqueado (modo privado) cada pestaña sigue solo con su reloj. */
function leerActividadCompartida(): number {
  try {
    return Number(localStorage.getItem(CLAVE_ACTIVIDAD)) || 0;
  } catch {
    return 0;
  }
}

function compartir(clave: string, valor: string): boolean {
  try {
    localStorage.setItem(clave, valor);
    return true;
  } catch {
    return false;
  }
}

export function useLogout() {
  const cerrarSesionLocal = useAuthStore((estado) => estado.cerrarSesionLocal);
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (_motivo: MotivoCierre | null) => authApi.logout(),
    onSettled: (_datos, _error, motivo) => {
      // El sufijo cambia el valor en cada cierre: `storage` solo se dispara si el valor cambia.
      compartir(CLAVE_CIERRE, `${motivo ?? 'manual'}:${Date.now()}`);
      cerrarSesionLocal(motivo ?? undefined);
      queryClient.clear();
    },
  });
}

export interface ControlInactividad {
  segundosRestantes: number | null;
  continuar: () => void;
  cerrarSesion: () => void;
}

/**
 * Cierra la sesión tras 30 minutos sin interacción (HU-32, ADR-016): el plazo es
 * compartido entre pestañas y un latido impide que el servidor cierre a quien
 * estuvo escribiendo sin enviar peticiones.
 */
export function useInactividad(): ControlInactividad {
  const cerrarSesionLocal = useAuthStore((estado) => estado.cerrarSesionLocal);
  // `mutate` es estable entre renders; el objeto de la mutación no, y recrearía el intervalo.
  const { mutate: cerrarSesionRemota } = useLogout();
  const queryClient = useQueryClient();
  const [segundosRestantes, setSegundosRestantes] = useState<number | null>(null);
  // La marca se fija en el efecto de montaje: `Date.now()` en render sería impuro.
  const marcaLocal = useRef(0);
  const ultimaEscritura = useRef(0);
  const avisoAbierto = useRef(false);
  const cerrando = useRef(false);

  const latido = useCallback(() => {
    if (msDesdeUltimaPeticion() >= LATIDO_SESION_MS) {
      // Un 401 lo resuelve el api-client; un fallo de red solo pierde ese latido.
      void authApi.me().catch(() => null);
    }
  }, []);

  const registrarActividad = useCallback(() => {
    const ahora = Date.now();
    marcaLocal.current = ahora;
    if (ahora - ultimaEscritura.current >= ESCRITURA_ACTIVIDAD_MS) {
      if (compartir(CLAVE_ACTIVIDAD, String(ahora))) {
        ultimaEscritura.current = ahora;
      }
    }
    latido();
  }, [latido]);

  useEffect(() => {
    // Una sesión nueva no hereda la inactividad de la anterior.
    const ahora = Date.now();
    marcaLocal.current = ahora;
    ultimaEscritura.current = ahora;
    compartir(CLAVE_ACTIVIDAD, String(ahora));
  }, []);

  useEffect(() => {
    const alInteractuar = () => {
      // Con el aviso abierto solo "Continuar" cuenta como actividad.
      if (!avisoAbierto.current) {
        registrarActividad();
      }
    };
    for (const evento of EVENTOS_ACTIVIDAD) {
      window.addEventListener(evento, alInteractuar, { capture: true, passive: true });
    }
    return () => {
      for (const evento of EVENTOS_ACTIVIDAD) {
        window.removeEventListener(evento, alInteractuar, { capture: true });
      }
    };
  }, [registrarActividad]);

  useEffect(() => {
    const temporizador = setInterval(() => {
      if (cerrando.current) {
        return;
      }
      const inactivo = Date.now() - Math.max(marcaLocal.current, leerActividadCompartida());
      if (inactivo >= INACTIVIDAD_SESION_MS) {
        cerrando.current = true;
        cerrarSesionRemota('inactividad');
        return;
      }
      const restante = INACTIVIDAD_SESION_MS - inactivo;
      const siguiente = restante <= AVISO_INACTIVIDAD_MS ? Math.ceil(restante / 1_000) : null;
      avisoAbierto.current = siguiente !== null;
      setSegundosRestantes((previo) => (previo === siguiente ? previo : siguiente));
    }, 1_000);
    return () => clearInterval(temporizador);
  }, [cerrarSesionRemota]);

  useEffect(() => {
    const alCambiar = (evento: StorageEvent) => {
      if (evento.key !== CLAVE_CIERRE || !evento.newValue) {
        return;
      }
      const motivo = evento.newValue.split(':')[0];
      cerrarSesionLocal(motivo === 'inactividad' ? 'inactividad' : undefined);
      queryClient.clear();
    };
    window.addEventListener('storage', alCambiar);
    return () => window.removeEventListener('storage', alCambiar);
  }, [cerrarSesionLocal, queryClient]);

  const continuar = useCallback(() => {
    avisoAbierto.current = false;
    setSegundosRestantes(null);
    const ahora = Date.now();
    marcaLocal.current = ahora;
    ultimaEscritura.current = ahora;
    compartir(CLAVE_ACTIVIDAD, String(ahora));
    latido();
  }, [latido]);

  const cerrarSesion = useCallback(() => {
    // Detiene el reloj para que el cierre por inactividad no se dispare durante el logout.
    cerrando.current = true;
    cerrarSesionRemota(null);
  }, [cerrarSesionRemota]);

  return { segundosRestantes, continuar, cerrarSesion };
}

/**
 * Restaura la sesión al cargar usando la cookie de refresh; `refrescarToken`
 * deduplica el intento (StrictMode monta el efecto dos veces).
 */
export function useRestaurarSesion(): boolean {
  const [listo, setListo] = useState(false);

  useEffect(() => {
    let vigente = true;
    void refrescarToken().finally(() => {
      if (vigente) {
        setListo(true);
      }
    });
    return () => {
      vigente = false;
    };
  }, []);

  return listo;
}
