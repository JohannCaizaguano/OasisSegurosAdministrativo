import { useEffect, useRef } from 'react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

/** La contraseña temporal vive en estado local del padre y se descarta al cerrar (D4). */
export function DialogoContrasenaTemporal({
  contrasena,
  alCerrar,
}: {
  contrasena: string | null;
  alCerrar: () => void;
}) {
  const botonCopiar = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (contrasena) {
      botonCopiar.current?.focus();
    }
  }, [contrasena]);

  async function copiar() {
    try {
      await navigator.clipboard.writeText(contrasena ?? '');
      toast.success('Contraseña copiada');
    } catch {
      toast.error('No se pudo copiar; selecciónela manualmente');
    }
  }

  return (
    <Dialog
      open={contrasena !== null}
      onOpenChange={(abierto) => {
        if (!abierto) {
          alCerrar();
        }
      }}
    >
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Contraseña temporal</DialogTitle>
          <DialogDescription>Esta contraseña no se volverá a mostrar.</DialogDescription>
        </DialogHeader>
        <p
          className="select-all break-all rounded-md border bg-[var(--muted)] p-3 font-mono text-sm"
          data-testid="contrasena-temporal"
        >
          {contrasena}
        </p>
        <DialogFooter>
          <Button
            ref={botonCopiar}
            type="button"
            variant="outline"
            onClick={() => void copiar()}
            data-testid="boton-copiar-contrasena"
          >
            Copiar
          </Button>
          <Button type="button" onClick={alCerrar}>
            Listo
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
