import { cva, type VariantProps } from 'class-variance-authority';
import type { HTMLAttributes } from 'react';

import { cn } from '@/lib/utils';

const variantes = cva(
  'inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium transition-colors',
  {
    variants: {
      variant: {
        default: 'border-transparent bg-[var(--primary)] text-[var(--primary-foreground)]',
        secondary: 'border-transparent bg-[var(--secondary)] text-[var(--secondary-foreground)]',
        destructive:
          'border-transparent bg-[var(--destructive)] text-[var(--destructive-foreground)]',
        outline: 'text-[var(--foreground)]',
        success:
          'border-transparent bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-100',
        warning:
          'border-transparent bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-100',
      },
    },
    defaultVariants: { variant: 'default' },
  },
);

export interface BadgeProps
  extends HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof variantes> {}

export function Badge({ className, variant, ...props }: BadgeProps) {
  return <span className={cn(variantes({ variant }), className)} {...props} />;
}
