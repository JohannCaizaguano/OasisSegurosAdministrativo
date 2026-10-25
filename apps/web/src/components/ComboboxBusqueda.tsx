import { X } from 'lucide-react';
import { useId, useRef, useState, type KeyboardEvent, type ReactNode } from 'react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useDebounce } from '@/lib/use-debounce';
import { cn } from '@/lib/utils';

/** Lo que el combobox necesita de una consulta de React Query. */
export interface ResultadosBusqueda<T> {
  data?: T[];
  isFetching: boolean;
  isError: boolean;
  refetch: () => unknown;
}

export interface ComboboxBusquedaProps<T extends { id: string }> {
  /** Hook de búsqueda en el servidor; `habilitada` es falso con una selección hecha. */
  useResultados: (q: string | undefined, habilitada: boolean) => ResultadosBusqueda<T>;
  texto: (item: T) => string;
  detalle?: (item: T) => ReactNode;
  onChange: (item: T | undefined) => void;
  etiquetaLista: string;
  etiquetaQuitar: string;
  mensajeError: string;
  placeholder: string;
  id?: string;
  'aria-invalid'?: boolean;
  'aria-describedby'?: string;
}

/**
 * Combobox ARIA 1.2 (D16 de S3): la búsqueda y el resaltado viven en el servidor; el foco
 * se queda en el input y `aria-activedescendant` apunta a la opción resaltada.
 * Es no controlado: reporta la selección por `onChange` y el padre lo remonta con una `key`
 * cuando necesita vaciarla (p. ej. "Limpiar filtros").
 */
export function ComboboxBusqueda<T extends { id: string }>({
  useResultados,
  texto: textoDe,
  detalle,
  onChange,
  etiquetaLista,
  etiquetaQuitar,
  mensajeError,
  placeholder,
  id,
  'aria-invalid': ariaInvalid,
  'aria-describedby': ariaDescrito,
}: ComboboxBusquedaProps<T>) {
  const idGenerado = useId();
  const idBase = id ?? idGenerado;
  const idLista = `${idBase}-lista`;

  const [texto, setTexto] = useState('');
  const [abierto, setAbierto] = useState(false);
  const [activo, setActivo] = useState(-1);
  const [seleccionado, setSeleccionado] = useState<T | null>(null);
  const entrada = useRef<HTMLInputElement>(null);

  const q = useDebounce(texto);
  const consulta = useResultados(q || undefined, abierto && seleccionado === null);
  const items = consulta.data ?? [];
  const indiceActivo = activo >= 0 && activo < items.length ? activo : -1;
  const opcionActiva = indiceActivo >= 0 ? items[indiceActivo] : undefined;

  function elegir(item: T) {
    setSeleccionado(item);
    setTexto(textoDe(item));
    setActivo(-1);
    setAbierto(false);
    onChange(item);
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
      setActivo(Math.min(indiceActivo + 1, items.length - 1));
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
          variant="quiet"
          size="icon"
          aria-label={etiquetaQuitar}
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
            className="absolute z-50 mt-1 flex w-full flex-wrap items-center justify-between gap-2 rounded-md bg-popover px-3 py-2 shadow-md"
          >
            <span className="font-medium text-destructive">{mensajeError}</span>
            <button
              type="button"
              className="inline-flex min-h-control items-center rounded-sm font-semibold text-link underline"
              onClick={() => void consulta.refetch()}
            >
              Reintentar
            </button>
          </div>
        ) : (
          <ul
            id={idLista}
            role="listbox"
            aria-label={etiquetaLista}
            className="absolute z-50 mt-1 max-h-60 w-full overflow-y-auto rounded-md bg-popover p-1.5 text-popover-foreground shadow-md"
          >
            {consulta.isFetching && (
              <li role="presentation" className="px-3 py-2.5 text-muted-foreground">
                Buscando…
              </li>
            )}
            {!consulta.isFetching && items.length === 0 && (
              <li role="presentation" className="px-3 py-2.5 text-muted-foreground">
                Sin resultados
              </li>
            )}
            {items.map((item, indice) => (
              <li
                key={item.id}
                id={`${idBase}-opcion-${item.id}`}
                role="option"
                aria-selected={indice === indiceActivo}
                className={cn(
                  'flex min-h-control cursor-pointer flex-wrap items-center rounded-md px-3 py-2',
                  indice === indiceActivo && 'bg-accent text-accent-foreground',
                )}
                onMouseDown={(evento) => evento.preventDefault()}
                onClick={() => elegir(item)}
              >
                {textoDe(item)}
                {detalle && (
                  <span className="cifra text-muted-foreground">&nbsp;— {detalle(item)}</span>
                )}
              </li>
            ))}
          </ul>
        ))}
    </div>
  );
}
