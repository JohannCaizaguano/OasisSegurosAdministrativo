import { loginSchema, type LoginInput } from '@oasis/shared';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { Navigate, useLocation, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ApiError } from '@/lib/api-client';
import { useAuthStore } from '@/lib/auth-store';

import { useLogin } from '../hooks';

export function LoginPage() {
  const autenticado = useAuthStore((estado) => estado.autenticado);
  const login = useLogin();
  const navegar = useNavigate();
  const ubicacion = useLocation();
  const destino =
    (ubicacion.state as { desde?: { pathname?: string } } | null)?.desde?.pathname ?? '/';

  const formulario = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: '', password: '' },
  });

  if (autenticado) {
    return <Navigate to="/" replace />;
  }

  const enviar = formulario.handleSubmit((datos) => {
    login.mutate(datos, {
      onSuccess: () => {
        toast.success('Bienvenido a Oasis Seguros');
        navegar(destino, { replace: true });
      },
      onError: (error) => {
        const mensaje = error instanceof ApiError ? error.message : 'No fue posible iniciar sesión';
        toast.error(mensaje);
      },
    });
  });

  return (
    <div className="flex min-h-screen items-center justify-center bg-[var(--muted)] px-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-2xl">Oasis Seguros</CardTitle>
          <CardDescription>
            Sistema administrativo con recibos verificables en blockchain
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form className="grid gap-4" onSubmit={enviar} data-testid="formulario-login">
            <div className="grid gap-2">
              <Label htmlFor="email">Correo electrónico</Label>
              <Input
                id="email"
                type="email"
                autoComplete="email"
                {...formulario.register('email')}
              />
              {formulario.formState.errors.email && (
                <p className="text-sm text-[var(--destructive)]">
                  {formulario.formState.errors.email.message}
                </p>
              )}
            </div>
            <div className="grid gap-2">
              <Label htmlFor="password">Contraseña</Label>
              <Input
                id="password"
                type="password"
                autoComplete="current-password"
                {...formulario.register('password')}
              />
              {formulario.formState.errors.password && (
                <p className="text-sm text-[var(--destructive)]">
                  {formulario.formState.errors.password.message}
                </p>
              )}
            </div>
            <Button type="submit" disabled={login.isPending} data-testid="boton-login">
              {login.isPending ? 'Ingresando…' : 'Ingresar'}
            </Button>
          </form>
          <p className="mt-4 text-center text-xs text-[var(--muted-foreground)]">
            ¿Necesita verificar un recibo?{' '}
            <a className="underline" href="/verificar">
              Ir a la página pública
            </a>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
