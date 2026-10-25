import * as TabsPrimitive from '@radix-ui/react-tabs';
import type { ComponentProps } from 'react';

import { cn } from '@/lib/utils';

export const Tabs = TabsPrimitive.Root;

export function TabsList({ className, ...props }: ComponentProps<typeof TabsPrimitive.List>) {
  return (
    <TabsPrimitive.List
      className={cn(
        'flex flex-wrap items-center gap-2',
        className,
      )}
      {...props}
    />
  );
}

export function TabsTrigger({ className, ...props }: ComponentProps<typeof TabsPrimitive.Trigger>) {
  return (
    <TabsPrimitive.Trigger
      className={cn(
        // Pestaña de filtro (DESIGN.md): píldora de papel; la activa, en tinta noche.
        'inline-flex min-h-control items-center justify-center rounded-full bg-card px-4 font-medium whitespace-nowrap text-foreground shadow-sm',
        'disabled:cursor-not-allowed disabled:opacity-45',
        'data-[state=active]:bg-foreground data-[state=active]:font-semibold data-[state=active]:text-card',
        className,
      )}
      {...props}
    />
  );
}

export function TabsContent({ className, ...props }: ComponentProps<typeof TabsPrimitive.Content>) {
  return (
    <TabsPrimitive.Content
      className={cn('mt-4', className)}
      {...props}
    />
  );
}
