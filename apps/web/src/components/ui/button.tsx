import { Slot } from '@radix-ui/react-slot';
import { cva, type VariantProps } from 'class-variance-authority';
import type { ComponentProps } from 'react';

import { cn } from '@/lib/utils';

/**
 * Botones Claroscuro (DESIGN.md §Buttons): una sola acción `primary` (oro) por vista; el resto,
 * papel (`secondary`), arena (`quiet`) o contorno rojo (`danger-outline`). `danger` solo confirma
 * lo que no se deshace. Todas las alturas cumplen el objetivo táctil de 44 px.
 */
const variantes = cva(
  'inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-label font-semibold transition-transform active:scale-[.97] motion-reduce:active:scale-100 disabled:cursor-not-allowed disabled:opacity-45 disabled:active:scale-100 [&_svg]:pointer-events-none [&_svg]:size-[18px] [&_svg]:shrink-0',
  {
    variants: {
      variant: {
        primary:
          'bg-primary bg-[image:var(--gold-gradient)] text-primary-foreground shadow-oro hover:brightness-106',
        secondary: 'bg-card text-foreground shadow-sm hover:bg-secondary',
        quiet: 'bg-secondary text-secondary-foreground hover:brightness-97',
        'danger-outline':
          'bg-card text-destructive shadow-[inset_0_0_0_1.5px_var(--destructive)] hover:bg-estado-error-fondo',
        danger: 'bg-destructive text-destructive-foreground hover:brightness-110',
        link: 'text-link underline decoration-1 underline-offset-3 hover:decoration-2',
      },
      size: {
        default: 'min-h-control px-[18px]',
        sm: 'min-h-control px-3',
        lg: 'min-h-[52px] px-6 text-base',
        login: 'min-h-login w-full px-6 text-base',
        icon: 'size-control',
      },
    },
    compoundVariants: [{ variant: 'primary', size: 'login', className: 'shadow-oro-login' }],
    defaultVariants: { variant: 'primary', size: 'default' },
  },
);

export interface ButtonProps extends ComponentProps<'button'>, VariantProps<typeof variantes> {
  asChild?: boolean;
}

export function Button({ className, variant, size, asChild, ...props }: ButtonProps) {
  const Componente = asChild ? Slot : 'button';
  return <Componente className={cn(variantes({ variant, size }), className)} {...props} />;
}
