import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { RouterProvider } from 'react-router-dom';

import { Providers } from './app/providers';
import { router } from './app/router';
import { useRestaurarSesion } from './features/auth/hooks';
import './index.css';

function App() {
  const listo = useRestaurarSesion();

  if (!listo) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-sm text-[var(--muted-foreground)]">Cargando Oasis Seguros…</p>
      </div>
    );
  }

  return <RouterProvider router={router} />;
}

const contenedor = document.getElementById('root');
if (!contenedor) {
  throw new Error('No se encontró el contenedor #root');
}

createRoot(contenedor).render(
  <StrictMode>
    <Providers>
      <App />
    </Providers>
  </StrictMode>,
);
