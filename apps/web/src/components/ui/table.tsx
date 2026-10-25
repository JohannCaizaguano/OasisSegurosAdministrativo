import type {
  HTMLAttributes,
  TableHTMLAttributes,
  TdHTMLAttributes,
  ThHTMLAttributes,
} from 'react';

import { cn } from '@/lib/utils';

/**
 * Tabla Claroscuro: filas de 56 px con 12 px de padding vertical y separadores de hilo.
 * `region` nombra el contenedor desplazable y lo hace enfocable, para recorrerlo con el teclado
 * cuando las filas no tienen controles.
 */
export function Table({
  className,
  region,
  ...props
}: TableHTMLAttributes<HTMLTableElement> & { region?: string }) {
  return (
    <div
      className="relative w-full overflow-x-auto"
      {...(region ? { role: 'region', 'aria-label': region, tabIndex: 0 } : {})}
    >
      <table className={cn('w-full caption-bottom text-cuerpo', className)} {...props} />
    </div>
  );
}

export function TableHeader({ className, ...props }: HTMLAttributes<HTMLTableSectionElement>) {
  return <thead className={className} {...props} />;
}

export function TableBody({ className, ...props }: HTMLAttributes<HTMLTableSectionElement>) {
  return <tbody className={className} {...props} />;
}

export function TableRow({ className, ...props }: HTMLAttributes<HTMLTableRowElement>) {
  return (
    <tr
      className={cn(
        '[tbody>&]:border-t [tbody>&]:hover:bg-secondary/60',
        className,
      )}
      {...props}
    />
  );
}

export function TableHead({
  className,
  scope = 'col',
  ...props
}: ThHTMLAttributes<HTMLTableCellElement>) {
  return (
    <th
      scope={scope}
      className={cn(
        'h-10 px-3.5 text-left align-middle text-tabla font-semibold whitespace-nowrap text-muted-foreground uppercase',
        className,
      )}
      {...props}
    />
  );
}

export function TableCell({ className, ...props }: TdHTMLAttributes<HTMLTableCellElement>) {
  return <td className={cn('h-14 px-3.5 py-3 align-middle', className)} {...props} />;
}

export function TableEmpty({ mensaje }: { mensaje: string }) {
  return (
    <TableRow>
      <TableCell colSpan={99} className="py-10 text-center text-muted-foreground">
        {mensaje}
      </TableCell>
    </TableRow>
  );
}
