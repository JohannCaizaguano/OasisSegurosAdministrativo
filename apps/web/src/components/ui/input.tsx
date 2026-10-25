import type { ComponentProps } from 'react';

import { cn } from '@/lib/utils';

/**
 * Campo de 48 px y texto de 16 px (el teléfono no hace zoom). Foco: borde de 2 px en tinta con
 * halo dorado; error (`aria-invalid`): borde de 2 px rojo. El padding se compensa 1 px para que el
 * texto no salte al engrosar el borde.
 */
export const CLASES_CAMPO =
  'flex h-input w-full min-w-0 rounded-md border border-input bg-card px-[14px] text-base text-foreground placeholder:text-muted-foreground focus-visible:border-2 focus-visible:border-foreground focus-visible:px-[13px] focus-visible:shadow-[0_0_0_4px_var(--anillo-campo)] focus-visible:outline-none aria-invalid:border-2 aria-invalid:border-destructive aria-invalid:px-[13px] aria-invalid:focus-visible:border-destructive disabled:cursor-not-allowed disabled:opacity-45';

export function Input({ className, ...props }: ComponentProps<'input'>) {
  return <input className={cn(CLASES_CAMPO, className)} {...props} />;
}
