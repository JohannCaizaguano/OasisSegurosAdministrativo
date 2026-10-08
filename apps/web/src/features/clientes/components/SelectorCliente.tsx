import type { Cliente } from '@oasis/shared';
import { X } from 'lucide-react';
import { useId, useRef, useState, type KeyboardEvent } from 'react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useDebounce } from '@/lib/use-debounce';
import { cn } from '@/lib/utils';

import { nombreCliente } from '../nombre-cliente';
import { useClientes } from '../hooks';

interface SelectorClienteProps {
  onChange: (clienteId: string | undefined) => void;
  id?: string;
  'aria-invalid'?: boolean;
  'aria-describedby'?: string;
  placeholder?: string;
}

/**
 * Combobox ARIA 1.2 (D16): la búsqueda y el resaltado viven en el servidor; el foco
 * se queda en el input y `aria-activedescendant` apunta a la opción resaltada.
 * Es no controlado: reporta ids por `onChange` y el padre lo remonta con una `key`
 * cuando necesita vaciar la selección (p. ej. "Limpiar filtros").
 */
export function SelectorCliente({
  onChange,
  id,
  'aria-invalid': ariaInvalid,
  'aria-describedby': ariaDescrito,
  placeholder = 'Buscar cliente por nombre o identificación',
}: SelectorClienteProps) {
  const idGenerado = useId();
  const idBase = id ?? idGenerado;
  const idLista = `${idBase}-lista`;

  const [texto, setTexto] = useState('');
  const [abierto, setAbierto] = useState(false);
  const [activo, setActivo] = useState(-1);
  const [seleccionado, setSeleccionado] = useState<Cliente | null>(null);
  const entrada = useRef<HTMLInputElement>(null);

  const q = useDebounce(texto);
  const consulta = useClientes(
    { q: q || undefined, estado: 'ACTIVOS', page: 1, pageSize: 20 },
    abierto && seleccionado === null,
  );
  const clientes = consulta.data?.data ?? [];
  const indiceActivo = activo >= 0 && activo < clientes.length ? activo : -1;
  const opcionActiva = indiceActivo >= 0 ? clientes[indiceActivo] : undefined;

  function elegir(cliente: Cliente) {
    setSeleccionado(cliente);
    setTexto(nombreCliente(cliente));
    setActivo(-1);
    setAbierto(false);
    onChange(cliente.id);
  }

  function limpiar() {
    setSeleccionado(null);
    setTexto('');
    setActivo(-1);
    onChange(undefined);
    entrada.current?.focus();
  }

  function alCambiarTexto(valor: string) {
    setTexto(valor);
    setAbierto(true);
    setActivo(-1);
    if (seleccionado) {
      setSeleccionado(null);
      onChange(undefined);
    }
  }

  function alTeclear(evento: KeyboardEvent<HTMLInputElement>) {
    if (evento.key === 'ArrowDown') {
      evento.preventDefault();
      if (!abierto) {
        // Con una selección ya hecha la consulta está deshabilitada: abrir aquí
        // mostraría una lista vacía hasta que el usuario teclee.
        if (!seleccionado) {
          setAbierto(true);
        }
        return;
      }
      setActivo(Math.min(indiceActivo + 1, clientes.length - 1));
      return;
    }
    if (evento.key === 'ArrowUp') {
      evento.preventDefault();
      setActivo(Math.max(indiceActivo - 1, 0));
      return;
    }
    if (evento.key === 'Enter' && abierto) {
      // Sin preventDefault, Enter enviaría el formulario que contiene al combobox.
      evento.preventDefault();
      if (opcionActiva) {
        elegir(opcionActiva);
      }
      return;
    }
    if (evento.key === 'Escape' && abierto) {
      setAbierto(false);
      setActivo(-1);
    }
  }

  return (
    <div
      className="relative"
      onBlur={(evento) => {
        if (!evento.currentTarget.contains(evento.relatedTarget)) {
          setAbierto(false);
        }
      }}
    >
      <Input
        ref={entrada}
        id={idBase}
        role="combobox"
        aria-expanded={abierto}
        aria-controls={idLista}
        aria-activedescendant={opcionActiva ? `${idBase}-opcion-${opcionActiva.id}` : undefined}
        aria-autocomplete="list"
        aria-invalid={ariaInvalid}
        aria-describedby={ariaDescrito}
        autoComplete="off"
        placeholder={seleccionado ? undefined : placeholder}
        className={seleccionado ? 'pr-9' : undefined}
        value={texto}
        onChange={(evento) => alCambiarTexto(evento.target.value)}
        onFocus={() => {
          if (!seleccionado) {
            setAbierto(true);
          }
        }}
        onKeyDown={alTeclear}
      />
      {seleccionado && (
        <Button
          type="button"
          variant="ghost"
          size="icon"
          aria-label="Quitar cliente seleccionado"
          data-testid={`${idBase}-quitar`}
          className="absolute top-1/2 right-0.5 size-7 -translate-y-1/2"
          onClick={limpiar}
        >
          <X className="size-4" aria-hidden="true" />
        </Button>
      )}
      {abierto &&
        (consulta.isError ? (
          <div
            role="alert"
            className="absolute z-50 mt-1 flex w-full flex-wrap items-center justify-between gap-2 rounded-md border bg-[var(--popover)] px-2 py-1.5 text-sm shadow-md"
          >
            <span className="text-[var(--destructive)]">No se pudieron cargar los clientes.</span>
            <button
              type="button"
              className="rounded-sm underline focus-visible:ring-2 focus-visible:ring-[var(--ring)] focus-visible:outline-none"
              onClick={() => void consulta.refetch()}
            >
              Reintentar
            </button>
          </div>
        ) : (
          <ul
            id={idLista}
            role="listbox"
            aria-label="Sugerencias de clientes"
            className="absolute z-50 mt-1 max-h-60 w-full overflow-y-auto rounded-md border bg-[var(--popover)] p-1 text-[var(--popover-foreground)] shadow-md"
          >
            {consulta.isFetching && (
              <li
                role="presentation"
                className="px-2 py-1.5 text-sm text-[var(--muted-foreground)]"
              >
                Buscando…
              </li>
            )}
            {!consulta.isFetching && clientes.length === 0 && (
              <li
                role="presentation"
                className="px-2 py-1.5 text-sm text-[var(--muted-foreground)]"
              >
                Sin resultados
              </li>
            )}
            {clientes.map((cliente, indice) => (
              <li
                key={cliente.id}
                id={`${idBase}-opcion-${cliente.id}`}
                role="option"
                aria-selected={indice === indiceActivo}
                className={cn(
                  'cursor-pointer rounded-sm px-2 py-1.5 text-sm',
                  indice === indiceActivo && 'bg-[var(--accent)] text-[var(--accent-foreground)]',
                )}
                onMouseDown={(evento) => evento.preventDefault()}
                onClick={() => elegir(cliente)}
              >
                {nombreCliente(cliente)}
                <span className="text-[var(--muted-foreground)]"> — {cliente.identificacion}</span>
              </li>
            ))}
          </ul>
        ))}
    </div>
  );
}
