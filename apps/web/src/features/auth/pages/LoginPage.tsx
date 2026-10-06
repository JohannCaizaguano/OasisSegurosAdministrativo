import { loginSchema, type LoginInput } from '@oasis/shared';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ApiError } from '@/lib/api-client';
import { useAuthStore } from '@/lib/auth-store';

import { useLogin } from '../hooks';

export function LoginPage() {
  const motivoCierre = useAuthStore((estado) => estado.motivoCierre);
  const login = useLogin();

  const formulario = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: '', password: '' },
  });

  const enviar = formulario.handleSubmit((datos) => {
    login.mutate(datos, {
      onSuccess: () => {
        toast.success('Bienvenido a Oasis Seguros');
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
          {motivoCierre && (
            <p
              role="status"
              data-testid="aviso-cierre"
              className="mb-4 rounded-md border border-[var(--border)] bg-[var(--muted)] px-3 py-2 text-sm"
            >
              {motivoCierre === 'inactividad'
                ? 'Su sesión se cerró por inactividad.'
                : 'Su sesión se cerró. Inicie sesión de nuevo.'}
            </p>
          )}
          <form className="grid gap-4" onSubmit={enviar} data-testid="formulario-login">
            <div className="grid gap-2">
              <Label htmlFor="email">Correo electrónico</Label>
              <Input
                id="email"
                type="email"
                autoComplete="email"
                aria-invalid={formulario.formState.errors.email ? true : undefined}
                aria-describedby={formulario.formState.errors.email ? 'email-error' : undefined}
                {...formulario.register('email')}
              />
              {formulario.formState.errors.email && (
                <p id="email-error" role="alert" className="text-sm text-[var(--destructive)]">
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
                aria-invalid={formulario.formState.errors.password ? true : undefined}
                aria-describedby={
                  formulario.formState.errors.password ? 'password-error' : undefined
                }
                {...formulario.register('password')}
              />
              {formulario.formState.errors.password && (
                <p id="password-error" role="alert" className="text-sm text-[var(--destructive)]">
                  {formulario.formState.errors.password.message}
                </p>
              )}
            </div>
            <Button type="submit" disabled={login.isPending} data-testid="boton-login">
              {login.isPending ? 'Ingresando…' : 'Ingresar'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
