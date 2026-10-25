import { useEffect } from 'react';
import { Outlet, useLocation } from 'react-router-dom';

import isologo from '@/assets/isologo-oasis.png';
import { AvisoInactividad } from '@/features/auth/components/AvisoInactividad';
import { useAuthStore } from '@/lib/auth-store';

import { BarraInferiorCliente } from './BarraInferiorCliente';
import { MenuUsuario } from './MenuUsuario';
import { RielPersonal } from './RielPersonal';

/** React Router no desplaza a los anclajes: las pestañas del portal apuntan a secciones del inicio. */
function useDesplazarAlAncla() {
  const { pathname, hash } = useLocation();
  useEffect(() => {
    const destino = hash ? document.getElementById(decodeURIComponent(hash.slice(1))) : null;
    if (destino) {
      destino.scrollIntoView({ block: 'start' });
    } else {
      window.scrollTo(0, 0);
    }
  }, [pathname, hash]);
}

function SaltarAlContenido() {
  return (
    <a
      href="#contenido"
      // `not-sr-only` pone `padding: 0`: el padding y la altura de 44 px van con `focus:` para ganarle.
      className="sr-only rounded-md bg-card font-semibold text-foreground shadow-lg focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-50 focus:inline-flex focus:min-h-control focus:items-center focus:px-4 focus:py-3"
    >
      Saltar al contenido
    </a>
  );
}

/** Transición de vista del prototipo (`.view`): cada página nueva entra con fade-up; el ancla no la repite. */
function Vista() {
  const { pathname } = useLocation();
  return (
    <div key={pathname} className="animate-vista">
      <Outlet />
    </div>
  );
}

export function AppLayout() {
  const usuario = useAuthStore((estado) => estado.usuario);
  useDesplazarAlAncla();

  if (usuario?.rol === 'CLIENTE') {
    return (
      <div className="min-h-dvh pb-[calc(4rem+env(safe-area-inset-bottom))] riel:pb-0">
        <SaltarAlContenido />
        <header data-superficie="noche" className="bg-sidebar text-sidebar-foreground">
          <div className="mx-auto flex h-16 max-w-5xl items-center justify-between gap-4 px-4 riel:px-[30px]">
            <img src={isologo} alt="Oasis Seguros" width={44} height={44} className="size-11" />
            <MenuUsuario />
          </div>
        </header>
        <BarraInferiorCliente />
        <main
          id="contenido"
          tabIndex={-1}
          className="mx-auto max-w-5xl min-w-0 px-4 pt-4 pb-8 outline-none riel:px-[30px] riel:pt-[22px]"
        >
          <Vista />
        </main>
        <AvisoInactividad />
      </div>
    );
  }

  return (
    <div className="min-h-dvh riel:flex">
      <SaltarAlContenido />
      {usuario ? <RielPersonal rol={usuario.rol} /> : null}
      <main
        id="contenido"
        tabIndex={-1}
        className="min-w-0 flex-1 px-4 pt-[18px] pb-10 outline-none riel:px-[30px] riel:pt-[22px]"
      >
        <Vista />
      </main>
      <AvisoInactividad />
    </div>
  );
}
