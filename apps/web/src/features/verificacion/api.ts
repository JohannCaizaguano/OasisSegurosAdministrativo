import type { VerificacionRecibo } from '@oasis/shared';

import { api } from '@/lib/api-client';

export const verificacionApi = {
  // `encodeURIComponent`: el código viene de la URL o de lo que el usuario
  // escribe, y sin escapar un `/` o un `?` rompería la ruta o la consulta.
  obtener: (codigo: string) =>
    api.get<VerificacionRecibo>(`/recibos/${encodeURIComponent(codigo)}/verificacion`),
};
