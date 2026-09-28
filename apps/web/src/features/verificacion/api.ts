import type { VerificacionPublica } from '@oasis/shared';

import { api } from '@/lib/api-client';

export const verificacionApi = {
  // `encodeURIComponent`: el código viene de la URL o de lo que el usuario
  // escribe, y sin escapar un `/` o un `?` rompería la ruta o la consulta.
  obtener: (codigo: string) =>
    api.get<VerificacionPublica>(`/public/recibos/${encodeURIComponent(codigo)}/verificacion`),
};
