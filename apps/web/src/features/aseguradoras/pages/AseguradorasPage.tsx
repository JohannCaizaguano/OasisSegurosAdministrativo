import type { Aseguradora } from '@oasis/shared';
import { MoreHorizontal, Plus } from 'lucide-react';
import { useDeferredValue, useState } from 'react';

import { CampoBusqueda } from '@/components/CampoBusqueda';
import { Encabezado } from '@/components/layout/Encabezado';
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
    <div className="grid gap-5">
      <Encabezado
        titulo="Aseguradoras"
        descripcion="Datos de referencia de las pólizas; sin cuenta ni acceso al sistema."
      >
        {esAdmin && (
          <Button data-testid="boton-nueva-aseguradora" onClick={() => abrirFormulario(null)}>
            <Plus aria-hidden="true" />
            Nueva aseguradora
          </Button>
        )}
      </Encabezado>

      <CampoBusqueda
        aria-label="Buscar aseguradoras"
        placeholder="Buscar por nombre o RUC"
        value={q}
        onChange={(evento) => {
          setQ(evento.target.value);
          setPagina(1);
        }}
      />

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
                <TableCell className="font-semibold">{aseguradora.nombre}</TableCell>
                <TableCell className="cifra">{aseguradora.ruc}</TableCell>
                <TableCell className="whitespace-nowrap">
                  {formatearFecha(aseguradora.createdAt)}
                </TableCell>
                {esAdmin && (
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="quiet"
                          size="icon"
                          aria-label={`Acciones de ${aseguradora.nombre}`}
                          data-testid={`menu-aseguradora-${aseguradora.id}`}
                        >
                          <MoreHorizontal aria-hidden="true" />
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
