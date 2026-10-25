import { Encabezado } from '@/components/layout/Encabezado';
import { useAuthStore } from '@/lib/auth-store';

import { PanelCliente } from '../components/PanelCliente';
import { PanelPersonal } from '../components/PanelPersonal';

export function DashboardPage() {
  const usuario = useAuthStore((estado) => estado.usuario);
  const esCliente = usuario?.rol === 'CLIENTE';

  return (
    <div className="grid gap-5">
      <Encabezado
        titulo={`Hola, ${usuario?.nombre ?? ''}`}
        descripcion={
          esCliente
            ? 'Consulte sus pólizas y el estado de sus pagos.'
            : 'Empiece por los pagos que esperan validación.'
        }
      />
      {esCliente ? <PanelCliente /> : <PanelPersonal />}
    </div>
  );
}
