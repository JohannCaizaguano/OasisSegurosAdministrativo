import type { AccionAuditoria } from '@oasis/shared';
import { ACCIONES_AUDITORIA } from '@oasis/shared';
import { useId, useState } from 'react';

import { AvisoError, EsqueletoTabla } from '@/components/DataState';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableEmpty,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { formatearFechaHoraEcuador } from '@/lib/format';

import { useBitacora, useUsuariosParaFiltro } from '../hooks';

const ETIQUETAS_ACCION: Record<AccionAuditoria, string> = {
  CREAR: 'Creación',
  MODIFICAR: 'Modificación',
  ELIMINAR: 'Eliminación',
  VALIDAR: 'Validación',
  RECHAZAR: 'Rechazo',
  ANULAR: 'Anulación',
  REINTENTAR: 'Reintento',
  INICIAR_SESION: 'Inicio de sesión',
  IMPORTAR: 'Importación',
  DESACTIVAR: 'Desactivación',
  REACTIVAR: 'Reactivación',
  RESTABLECER_CONTRASENA: 'Restablecimiento de contraseña',
};

const ETIQUETAS_ENTIDAD: Record<string, string> = { Poliza: 'Póliza' };
const TODOS = 'TODOS';
const TODAS = 'TODAS';

function etiquetaAccion(accion: string): string {
  return (ETIQUETAS_ACCION as Record<string, string>)[accion] ?? accion;
}

function etiquetaEntidad(entidad: string): string {
  return ETIQUETAS_ENTIDAD[entidad] ?? entidad;
}

export function BitacoraPage() {
  const idUsuario = useId();
  const idAccion = useId();
  const idDesde = useId();
  const idHasta = useId();

  const [usuarioId, setUsuarioId] = useState(TODOS);
  const [accion, setAccion] = useState(TODAS);
  const [desde, setDesde] = useState('');
  const [hasta, setHasta] = useState('');
  const [pagina, setPagina] = useState(1);

  const usuarios = useUsuariosParaFiltro();
  const consulta = useBitacora({
    page: pagina,
    pageSize: 20,
    usuarioId: usuarioId === TODOS ? undefined : usuarioId,
    accion: accion === TODAS ? undefined : (accion as AccionAuditoria),
    desde: desde || undefined,
    hasta: hasta || undefined,
  });

  const meta = consulta.data?.meta;

  function limpiarFiltros() {
    setUsuarioId(TODOS);
    setAccion(TODAS);
    setDesde('');
    setHasta('');
    setPagina(1);
  }

  return (
    <div className="grid gap-4">
      <div>
        <h1 className="text-2xl font-semibold">Bitácora</h1>
        <p className="text-sm text-[var(--muted-foreground)]">
          Quién hizo qué y cuándo: acciones del sistema con su usuario, fecha, IP y entidad.
        </p>
      </div>

      <div className="flex flex-wrap items-end gap-3">
        <div className="grid gap-1.5">
          <Label htmlFor={idUsuario}>Usuario</Label>
          <Select
            value={usuarioId}
            onValueChange={(valor) => {
              setUsuarioId(valor);
              setPagina(1);
            }}
          >
            <SelectTrigger id={idUsuario} className="w-56">
              <SelectValue placeholder="Usuario" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={TODOS}>Todos los usuarios</SelectItem>
              {(usuarios.data ?? []).map((usuario) => (
                <SelectItem key={usuario.id} value={usuario.id}>
                  {usuario.email}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="grid gap-1.5">
          <Label htmlFor={idAccion}>Acción</Label>
          <Select
            value={accion}
            onValueChange={(valor) => {
              setAccion(valor);
              setPagina(1);
            }}
          >
            <SelectTrigger id={idAccion} className="w-48">
              <SelectValue placeholder="Acción" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={TODAS}>Todas las acciones</SelectItem>
              {ACCIONES_AUDITORIA.map((valor) => (
                <SelectItem key={valor} value={valor}>
                  {ETIQUETAS_ACCION[valor]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="grid gap-1.5">
          <Label htmlFor={idDesde}>Desde</Label>
          <Input
            id={idDesde}
            type="date"
            value={desde}
            max={hasta || undefined}
            onChange={(evento) => {
              setDesde(evento.target.value);
              setPagina(1);
            }}
          />
        </div>

        <div className="grid gap-1.5">
          <Label htmlFor={idHasta}>Hasta</Label>
          <Input
            id={idHasta}
            type="date"
            value={hasta}
            min={desde || undefined}
            onChange={(evento) => {
              setHasta(evento.target.value);
              setPagina(1);
            }}
          />
        </div>

        <Button type="button" variant="outline" onClick={limpiarFiltros}>
          Limpiar filtros
        </Button>
      </div>

      {/* min-w-0: sin él, el min-content de la tabla estira la pista del grid y el scroll interno no actúa. */}
      <Card className="min-w-0">
        <CardHeader className="flex flex-row items-center justify-between gap-2">
          <CardTitle className="text-base">Registros</CardTitle>
          <span aria-live="polite" className="text-sm text-[var(--muted-foreground)]">
            {meta ? `${meta.total} registros` : '—'}
          </span>
        </CardHeader>
        <CardContent>
          {consulta.isLoading ? (
            <EsqueletoTabla />
          ) : consulta.isError ? (
            <AvisoError error={consulta.error} alReintentar={() => void consulta.refetch()} />
          ) : (
            <Table>
              <caption className="sr-only">Registros de la bitácora de auditoría</caption>
              <TableHeader>
                <TableRow>
                  <TableHead>Fecha y hora (Ecuador)</TableHead>
                  <TableHead>Usuario</TableHead>
                  <TableHead>Acción</TableHead>
                  <TableHead>Entidad</TableHead>
                  <TableHead>Registro</TableHead>
                  <TableHead>IP</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {consulta.data && consulta.data.data.length === 0 && (
                  <TableEmpty mensaje="No hay registros con estos filtros" />
                )}
                {consulta.data?.data.map((registro) => (
                  <TableRow key={registro.id}>
                    <TableCell className="whitespace-nowrap">
                      {formatearFechaHoraEcuador(registro.creadoEn)}
                    </TableCell>
                    <TableCell>{registro.usuarioEmail}</TableCell>
                    <TableCell>{etiquetaAccion(registro.accion)}</TableCell>
                    <TableCell>{etiquetaEntidad(registro.entidad)}</TableCell>
                    <TableCell
                      className="font-mono text-xs"
                      title={registro.entidadId ?? undefined}
                    >
                      {registro.entidadId ? registro.entidadId.slice(0, 8) : '—'}
                    </TableCell>
                    <TableCell>{registro.ip ?? '—'}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <div className="flex items-center justify-end gap-2 text-sm text-[var(--muted-foreground)]">
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={pagina <= 1 || consulta.isFetching}
          onClick={() => setPagina((valor) => valor - 1)}
        >
          Anterior
        </Button>
        <span className="py-1.5">
          Página {meta?.page ?? 1} de {meta?.totalPages ?? 1}
        </span>
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={!meta || meta.page >= meta.totalPages || consulta.isFetching}
          onClick={() => setPagina((valor) => valor + 1)}
        >
          Siguiente
        </Button>
      </div>
    </div>
  );
}
