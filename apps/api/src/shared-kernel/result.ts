export type Result<T, E> =
  { readonly ok: true; readonly value: T } | { readonly ok: false; readonly error: E };

export const Ok = <T>(value: T): Result<T, never> => ({ ok: true, value });

export const Err = <E>(error: E): Result<never, E> => ({ ok: false, error });

export function esOk<T, E>(result: Result<T, E>): result is { ok: true; value: T } {
  return result.ok;
}

export function esErr<T, E>(result: Result<T, E>): result is { ok: false; error: E } {
  return !result.ok;
}

export function mapear<T, U, E>(result: Result<T, E>, fn: (valor: T) => U): Result<U, E> {
  return result.ok ? Ok(fn(result.value)) : result;
}
