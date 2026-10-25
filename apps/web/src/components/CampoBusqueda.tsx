import { Search } from 'lucide-react';
import type { ComponentProps } from 'react';

import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

/** Campo de búsqueda con lupa; el padding izquierdo se conserva también con el borde de 2 px del foco. */
export function CampoBusqueda({ className, ...props }: Omit<ComponentProps<'input'>, 'type'>) {
  return (
    <div className={cn('relative w-full sm:max-w-xs', className)}>
      <Search
        className="pointer-events-none absolute top-1/2 left-3.5 size-[18px] -translate-y-1/2 text-muted-foreground"
        aria-hidden="true"
      />
      <Input type="search" className="pl-10 focus-visible:pl-[39px]" {...props} />
    </div>
  );
}
