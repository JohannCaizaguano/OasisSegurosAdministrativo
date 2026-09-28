import { useAuthStore } from '@/lib/auth-store';

import { PanelCliente } from '../components/panel-cliente';
import { PanelPersonal } from '../components/panel-personal';

export function DashboardPage() {
  const usuario = useAuthStore((estado) => estado.usuario);

  return (
    <div className="grid gap-5">
      <div>
        <h1 className="text-2xl font-semibold">Hola, {usuario?.nombre}</h1>
        <p className="text-sm text-[var(--muted-foreground)]">
          {usuario?.rol === 'CLIENTE'
            ? 'Consulte sus pólizas y el estado de sus pagos.'
            : 'Resumen operativo del bróker.'}
        </p>
      </div>
      {usuario?.rol === 'CLIENTE' ? <PanelCliente /> : <PanelPersonal />}
    </div>
  );
}
