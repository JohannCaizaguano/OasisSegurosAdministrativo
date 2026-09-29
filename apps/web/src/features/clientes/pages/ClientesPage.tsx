import { useState } from 'react';

import { AvisoError, EsqueletoTabla } from '@/components/DataState';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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
  TableEmpty,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

import { FormularioCliente } from '../components/FormularioCliente';
import { useClientes } from '../hooks';

export function ClientesPage() {
  const [abierto, setAbierto] = useState(false);
  const consulta = useClientes();

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

      <Card>
        <CardHeader>
          <CardTitle className="text-base">
            {consulta.data ? `${consulta.data.meta.total} clientes` : 'Clientes'}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {consulta.isLoading ? (
            <EsqueletoTabla />
          ) : consulta.isError ? (
            <AvisoError error={consulta.error} alReintentar={() => void consulta.refetch()} />
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Identificación</TableHead>
                  <TableHead>Nombre</TableHead>
                  <TableHead>Correo</TableHead>
                  <TableHead>Teléfono</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {consulta.data?.data.length === 0 && (
                  <TableEmpty mensaje="Sin clientes registrados" />
                )}
                {consulta.data?.data.map((cliente) => (
                  <TableRow key={cliente.id}>
                    <TableCell className="font-mono text-xs">{cliente.identificacion}</TableCell>
                    <TableCell>
                      {cliente.razonSocial ??
                        [cliente.nombres, cliente.apellidos].filter(Boolean).join(' ')}
                    </TableCell>
                    <TableCell>{cliente.email}</TableCell>
                    <TableCell>{cliente.telefono ?? '—'}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
