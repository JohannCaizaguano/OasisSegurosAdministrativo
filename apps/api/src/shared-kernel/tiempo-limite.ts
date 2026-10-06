/**
 * Rechaza si la promesa no termina a tiempo. Imprescindible con Redis: BullMQ configura
 * `maxRetriesPerRequest: null` y un comando con el servidor caído queda encolado sin fin.
 */
export function conTiempoLimite<T>(
  promesa: Promise<T>,
  descripcion: string,
  ms = 2_000,
): Promise<T> {
  return new Promise<T>((resolver, rechazar) => {
    const temporizador = setTimeout(
      () => rechazar(new Error(`${descripcion} no respondió en ${ms} ms`)),
      ms,
    );
    promesa
      .then((valor) => {
        clearTimeout(temporizador);
        resolver(valor);
      })
      .catch((error: unknown) => {
        clearTimeout(temporizador);
        rechazar(error instanceof Error ? error : new Error(String(error)));
      });
  });
}
