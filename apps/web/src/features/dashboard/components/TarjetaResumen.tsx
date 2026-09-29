import type { FileText } from 'lucide-react';

import { Card, CardContent } from '@/components/ui/card';

export function TarjetaResumen({
  titulo,
  valor,
  icono: Icono,
}: {
  titulo: string;
  valor: number | string;
  icono: typeof FileText;
}) {
  return (
    <Card>
      <CardContent className="flex items-center gap-4 pt-5">
        <span className="rounded-lg bg-[var(--accent)] p-2">
          <Icono className="size-5 text-[var(--primary)]" />
        </span>
        <div>
          <p className="text-sm text-[var(--muted-foreground)]">{titulo}</p>
          <p className="text-2xl font-semibold">{valor}</p>
        </div>
      </CardContent>
    </Card>
  );
}
