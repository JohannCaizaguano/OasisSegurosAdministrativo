import { useEffect, useState } from 'react';

/**
 * Retrasa la propagación de un valor; el temporizador se reinicia con cada cambio.
 * La búsqueda del servidor se limita así a una consulta por pausa de tecleo.
 */
export function useDebounce<T>(valor: T, milisegundos = 300): T {
  const [retrasado, setRetrasado] = useState(valor);

  useEffect(() => {
    const temporizador = setTimeout(() => setRetrasado(valor), milisegundos);
    return () => clearTimeout(temporizador);
  }, [valor, milisegundos]);

  return retrasado;
}
