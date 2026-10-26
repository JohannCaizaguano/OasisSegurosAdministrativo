import { useSearchParams } from 'react-router-dom';

/**
 * Filtros de una lista guardados en la URL (D15): se recargan y se comparten, y cambiarlos
 * reemplaza la entrada del historial en lugar de sumar una.
 */
export function useFiltrosEnUrl<Clave extends string>() {
  const [parametros, setParametros] = useSearchParams();

  return {
    leer: (clave: Clave): string | undefined => parametros.get(clave) || undefined,
    cambiar: (cambios: Partial<Record<Clave, string | undefined>>) =>
      setParametros(
        (previos) => {
          const siguientes = new URLSearchParams(previos);
          for (const [clave, valor] of Object.entries(cambios) as [Clave, string | undefined][]) {
            if (valor) {
              siguientes.set(clave, valor);
            } else {
              siguientes.delete(clave);
            }
          }
          return siguientes;
        },
        { replace: true },
      ),
    limpiar: () => setParametros({}, { replace: true }),
    hayFiltros: parametros.toString() !== '',
  };
}
