import type { Cliente, CrearClienteInput, RespuestaPaginada } from '@oasis/shared';
import { crearClienteSchema } from '@oasis/shared';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { useState } from 'react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Table,
  TableBody,
  TableCell,
  TableEmpty,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { api, ApiError } from '@/lib/api-client';

export const clientesApi = {
  listar: (busqueda?: string) =>
    api.get<RespuestaPaginada<Cliente>>(
      `/clientes?page=1&pageSize=50${busqueda ? `&q=${encodeURIComponent(busqueda)}` : ''}`,
    ),
  crear: (datos: CrearClienteInput) => api.post<Cliente>('/clientes', datos),
};

function FormularioCliente({ alGuardar }: { alGuardar: () => void }) {
  const formulario = useForm<CrearClienteInput>({
    resolver: zodResolver(crearClienteSchema),
    defaultValues: { tipoIdentificacion: 'CEDULA', identificacion: '', email: '' },
  });

  const crear = useMutation({
    mutationFn: clientesApi.crear,
    onSuccess: () => {
      toast.success('Cliente creado');
      alGuardar();
    },
    onError: (error) =>
      toast.error(error instanceof ApiError ? error.message : 'No fue posible crear el cliente'),
  });

  const tipo = formulario.watch('tipoIdentificacion');

  return (
    <form className="grid gap-4" onSubmit={formulario.handleSubmit((datos) => crear.mutate(datos))}>
      <div className="grid gap-2">
        <Label>Tipo de identificación</Label>
        <Select
          value={tipo}
          onValueChange={(valor) =>
            formulario.setValue(
              'tipoIdentificacion',
              valor as CrearClienteInput['tipoIdentificacion'],
            )
          }
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="CEDULA">Cédula</SelectItem>
            <SelectItem value="RUC">RUC</SelectItem>
            <SelectItem value="PASAPORTE">Pasaporte</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div className="grid gap-2">
        <Label htmlFor="identificacion">Identificación</Label>
        <Input id="identificacion" {...formulario.register('identificacion')} />
        {formulario.formState.errors.identificacion && (
          <p className="text-sm text-[var(--destructive)]">
            {formulario.formState.errors.identificacion.message}
          </p>
        )}
      </div>
      {tipo === 'RUC' ? (
        <div className="grid gap-2">
          <Label htmlFor="razonSocial">Razón social</Label>
          <Input id="razonSocial" {...formulario.register('razonSocial')} />
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="grid gap-2">
            <Label htmlFor="nombres">Nombres</Label>
            <Input id="nombres" {...formulario.register('nombres')} />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="apellidos">Apellidos</Label>
            <Input id="apellidos" {...formulario.register('apellidos')} />
          </div>
        </div>
      )}
      <div className="grid gap-2">
        <Label htmlFor="email">Correo electrónico</Label>
        <Input id="email" type="email" {...formulario.register('email')} />
        {formulario.formState.errors.email && (
          <p className="text-sm text-[var(--destructive)]">
            {formulario.formState.errors.email.message}
          </p>
        )}
      </div>
      <div className="grid gap-2">
        <Label htmlFor="telefono">Teléfono</Label>
        <Input id="telefono" {...formulario.register('telefono')} />
      </div>
      <DialogFooter>
        <Button type="submit" disabled={crear.isPending} data-testid="boton-guardar-cliente">
          {crear.isPending ? 'Guardando…' : 'Guardar cliente'}
        </Button>
      </DialogFooter>
    </form>
  );
}

export function ClientesPage() {
  const queryClient = useQueryClient();
  const [abierto, setAbierto] = useState(false);
  const consulta = useQuery({ queryKey: ['clientes'], queryFn: () => clientesApi.listar() });

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
            <FormularioCliente
              alGuardar={() => {
                setAbierto(false);
                void queryClient.invalidateQueries({ queryKey: ['clientes'] });
              }}
            />
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
            <div className="grid gap-2">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
            </div>
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
