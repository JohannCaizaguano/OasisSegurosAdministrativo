import type { ReactNode } from 'react';

import { Label } from '@/components/ui/label';

interface AtributosCampo {
  id: string;
  'aria-invalid'?: true;
  'aria-describedby'?: string;
}

export interface CampoProps {
  id: string;
  label: string;
  error?: string;
  /** Ayuda permanente del control; su id se enlaza junto con el del error. */
  ayuda?: string;
  children: (atributos: AtributosCampo) => ReactNode;
}

/** Label, control, ayuda y error de un campo, con el ARIA consistente en un solo sitio. */
export function Campo({ id, label, error, ayuda, children }: CampoProps) {
  const descrito = [error ? `${id}-error` : null, ayuda ? `${id}-ayuda` : null]
    .filter(Boolean)
    .join(' ');

  return (
    <div className="grid gap-2">
      <Label htmlFor={id}>{label}</Label>
      {children({
        id,
        'aria-invalid': error ? true : undefined,
        'aria-describedby': descrito || undefined,
      })}
      {ayuda && (
        <p id={`${id}-ayuda`} className="text-caption text-muted-foreground">
          {ayuda}
        </p>
      )}
      {error && (
        <p id={`${id}-error`} role="alert" className="text-caption font-medium text-destructive">
          {error}
        </p>
      )}
    </div>
  );
}
