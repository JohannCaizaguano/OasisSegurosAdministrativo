import type { Aseguradora } from '@oasis/shared';
import { MoreHorizontal, Search } from 'lucide-react';
import { useDeferredValue, useState } from 'react';

import { Paginacion, TablaDatos } from '@/components/TablaDatos';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { useAuthStore } from '@/lib/auth-store';
import { formatearFecha } from '@/lib/format';

import { FormularioAseguradora } from '../components/FormularioAseguradora';
import { useAseguradoras } from '../hooks';

export function AseguradorasPage() {
  const [q, setQ] = useState('');
  const [pagina, setPagina] = useState(1);
  const [formularioAbierto, setFormularioAbierto] = useState(false);
  const [enEdicion, setEnEdicion] = useState<Aseguradora | null>(null);

  // Diferir el término evita una consulta por pulsación sin agregar un debounce.
  const qDiferida = useDeferredValue(q);
  const consulta = useAseguradoras(qDiferida, pagina);
  const actor = useAuthStore((estado) => estado.usuario);
  const esAdmin = actor?.rol === 'ADMIN';

  const aseguradoras = consulta.data?.data ?? [];
  const meta = consulta.data?.meta;

  function abrirFormulario(aseguradora: Aseguradora | null) {
    setEnEdicion(aseguradora);
    setFormularioAbierto(true);
  }

  return (
    <div className="grid gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold">Aseguradoras</h1>
          <p className="text-sm text-[var(--muted-foreground)]">
            Datos de referencia de las pólizas; sin cuenta ni acceso al sistema.
          </p>
        </div>
        {esAdmin && (
          <Button data-testid="boton-nueva-aseguradora" onClick={() => abrirFormulario(null)}>
            Nueva aseguradora
          </Button>
        )}
      </div>

      <div className="relative w-full sm:max-w-xs">
        <Search
          className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-[var(--muted-foreground)]"
          aria-hidden="true"
        />
        <Input
          type="search"
          aria-label="Buscar aseguradoras"
          placeholder="Buscar por nombre o RUC"
          className="pl-9"
          value={q}
          onChange={(evento) => {
            setQ(evento.target.value);
            setPagina(1);
          }}
        />
      </div>

      <TablaDatos
        titulo={meta ? `${meta.total} aseguradoras` : 'Aseguradoras'}
        cargando={consulta.isLoading}
        error={consulta.error}
        alReintentar={() => void consulta.refetch()}
        vacio={
          q ? 'No hay aseguradoras que coincidan con la búsqueda' : 'Sin aseguradoras registradas'
        }
        hayDatos={aseguradoras.length > 0}
      >
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nombre</TableHead>
              <TableHead>RUC</TableHead>
              <TableHead>Alta</TableHead>
              {esAdmin && <TableHead className="text-right">Acciones</TableHead>}
            </TableRow>
          </TableHeader>
          <TableBody>
            {aseguradoras.map((aseguradora) => (
              <TableRow key={aseguradora.id}>
                <TableCell className="font-medium">{aseguradora.nombre}</TableCell>
                <TableCell className="font-mono text-xs">{aseguradora.ruc}</TableCell>
                <TableCell>{formatearFecha(aseguradora.createdAt)}</TableCell>
                {esAdmin && (
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          aria-label={`Acciones de ${aseguradora.nombre}`}
                          data-testid={`menu-aseguradora-${aseguradora.id}`}
                        >
                          <MoreHorizontal className="size-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onSelect={() => abrirFormulario(aseguradora)}>
                          Editar
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                )}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TablaDatos>

      {meta && meta.totalPages > 1 && (
        <Paginacion
          pagina={pagina}
          totalPaginas={meta.totalPages}
          cargando={consulta.isFetching}
          alCambiar={setPagina}
        />
      )}

      <Dialog
        open={formularioAbierto}
        onOpenChange={(abierto) => {
          setFormularioAbierto(abierto);
          if (!abierto) {
            setEnEdicion(null);
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{enEdicion ? 'Editar aseguradora' : 'Nueva aseguradora'}</DialogTitle>
            <DialogDescription>
              {enEdicion
                ? 'El RUC identifica a la aseguradora ante el SRI.'
                : 'Registre el nombre y el RUC de 13 dígitos.'}
            </DialogDescription>
          </DialogHeader>
          <FormularioAseguradora
            key={enEdicion?.id ?? 'nueva'}
            aseguradora={enEdicion ?? undefined}
            alGuardar={() => {
              setFormularioAbierto(false);
              setEnEdicion(null);
            }}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}
