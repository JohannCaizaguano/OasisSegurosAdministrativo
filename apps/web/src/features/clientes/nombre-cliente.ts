import type { Cliente } from '@oasis/shared';

/** Nombre visible de un cliente: razón social o nombres y apellidos. */
export function nombreCliente(
  cliente: Pick<Cliente, 'nombres' | 'apellidos' | 'razonSocial'>,
): string {
  return cliente.razonSocial ?? [cliente.nombres, cliente.apellidos].filter(Boolean).join(' ');
}
