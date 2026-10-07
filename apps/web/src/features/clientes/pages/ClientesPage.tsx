import { useState } from 'react';

import { TablaDatos } from '@/components/TablaDatos';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { formatearFecha } from '@/lib/format';

import { FormularioCliente } from '../components/FormularioCliente';
import { useClientes } from '../hooks';

export function ClientesPage() {
  const [abierto, setAbierto] = useState(false);
  const consulta = useClientes();

  const clientes = consulta.data?.data ?? [];
  const meta = consulta.data?.meta;

  return (
    <div className="grid gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold">Clientes</h1>
          <p className="text-sm text-[var(--muted-foreground)]">
            Cartera de asegurados registrados en el bróker.
          </p>
        </div>
        <Dialog open={abierto} onOpenChange={setAbierto}>
          <DialogTrigger asChild>
            <Button data-testid="boton-nuevo-cliente">Nuevo cliente</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Nuevo cliente</DialogTitle>
              <DialogDescription>
                Los datos personales nunca se escriben en la blockchain.
              </DialogDescription>
            </DialogHeader>
            <FormularioCliente alGuardar={() => setAbierto(false)} />
          </DialogContent>
        </Dialog>
      </div>

      <TablaDatos
        titulo={meta ? `${meta.total} clientes` : 'Clientes'}
        cargando={consulta.isLoading}
        error={consulta.error}
        alReintentar={() => void consulta.refetch()}
        vacio="Sin clientes registrados"
        hayDatos={clientes.length > 0}
      >
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Identificación</TableHead>
              <TableHead>Nombre</TableHead>
              <TableHead>Correo</TableHead>
              <TableHead>Teléfono</TableHead>
              <TableHead>Registrado</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {clientes.map((cliente) => (
              <TableRow key={cliente.id}>
                <TableCell className="font-mono text-xs">{cliente.identificacion}</TableCell>
                <TableCell>
                  {cliente.razonSocial ??
                    [cliente.nombres, cliente.apellidos].filter(Boolean).join(' ')}
                </TableCell>
                <TableCell>{cliente.email}</TableCell>
                <TableCell>{cliente.telefono ?? '—'}</TableCell>
                <TableCell>{formatearFecha(cliente.createdAt)}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TablaDatos>
    </div>
  );
}
