import { useRef } from 'react';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

import { useInactividad } from '../hooks';

/** Aviso de cierre por inactividad (HU-32): aparece en todas las pestañas y "Continuar" mantiene la sesión. */
export function AvisoInactividad() {
  const { segundosRestantes, continuar, cerrarSesion } = useInactividad();
  const botonContinuar = useRef<HTMLButtonElement>(null);

  return (
    <Dialog
      open={segundosRestantes !== null}
      onOpenChange={(abierto) => {
        if (!abierto) {
          continuar();
        }
      }}
    >
      <DialogContent
        role="alertdialog"
        aria-describedby="aviso-inactividad"
        onOpenAutoFocus={(evento) => {
          evento.preventDefault();
          botonContinuar.current?.focus();
        }}
      >
        <DialogHeader>
          <DialogTitle>¿Sigue ahí?</DialogTitle>
          {/* Sin aria-live: el lector la anuncia al abrir, no cada segundo. */}
          <DialogDescription id="aviso-inactividad">
            Su sesión se cerrará por inactividad en {segundosRestantes} s.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" onClick={cerrarSesion}>
            Cerrar sesión
          </Button>
          <Button ref={botonContinuar} onClick={continuar}>
            Continuar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
