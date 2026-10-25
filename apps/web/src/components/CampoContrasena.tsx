import { Eye, EyeOff } from 'lucide-react';
import { useState, type ComponentProps } from 'react';

import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

/**
 * Campo de contraseña con «Mostrar»/«Ocultar». El nombre del botón sale de su texto (sin
 * `aria-label`), para que `getByLabel('Contraseña')` siga encontrando solo el campo.
 */
export function CampoContrasena({ className, ...props }: Omit<ComponentProps<'input'>, 'type'>) {
  const [visible, setVisible] = useState(false);

  return (
    <div className="relative">
      <Input
        type={visible ? 'text' : 'password'}
        className={cn('pr-[116px] focus-visible:pr-[115px] aria-invalid:pr-[115px]', className)}
        {...props}
      />
      <button
        type="button"
        aria-pressed={visible}
        // Con el ratón, el foco se queda en el campo.
        onMouseDown={(evento) => evento.preventDefault()}
        onClick={() => setVisible((actual) => !actual)}
        className="absolute top-1/2 right-1 inline-flex min-h-control -translate-y-1/2 items-center gap-1.5 rounded-sm px-3 font-medium text-foreground hover:bg-secondary"
      >
        {visible ? (
          <EyeOff className="size-[18px]" aria-hidden="true" />
        ) : (
          <Eye className="size-[18px]" aria-hidden="true" />
        )}
        {visible ? 'Ocultar' : 'Mostrar'} <span className="sr-only">contraseña</span>
      </button>
    </div>
  );
}
