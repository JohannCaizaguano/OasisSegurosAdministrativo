import { Component, type ErrorInfo, type ReactNode } from 'react';
import { Link } from 'react-router-dom';

import { AvisoError } from '@/components/data-state';
import { Button } from '@/components/ui/button';

interface Estado {
  error: Error | null;
}

/**
 * Frontera de error de la aplicación.
 *
 * Sin ella, cualquier excepción de render desmontaba el árbol completo y
 * dejaba la SPA en blanco, sin mensaje ni forma de reintentar.
 */
export class ErrorBoundary extends Component<{ children: ReactNode }, Estado> {
  override state: Estado = { error: null };

  static getDerivedStateFromError(error: Error): Estado {
    return { error };
  }

  override componentDidCatch(error: Error, info: ErrorInfo): void {
    console.error('Error no controlado en la interfaz', error, info.componentStack);
  }

  override render(): ReactNode {
    const { error } = this.state;
    if (!error) {
      return this.props.children;
    }

    return (
      <div className="mx-auto grid min-h-screen max-w-lg content-center gap-4 p-6">
        <h1 className="text-xl font-semibold">Algo salió mal en la interfaz</h1>
        <AvisoError error={error} alReintentar={() => this.setState({ error: null })} />
        <div className="flex gap-2">
          <Button asChild variant="outline" size="sm">
            <Link to="/">Ir al inicio</Link>
          </Button>
          <Button asChild variant="ghost" size="sm">
            <a href="/verificar">Verificar un recibo</a>
          </Button>
        </div>
      </div>
    );
  }
}
