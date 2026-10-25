import { loginSchema, type LoginInput } from '@oasis/shared';
import { zodResolver } from '@hookform/resolvers/zod';
import { Info } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';

import isologo from '@/assets/isologo-oasis.png';
import fotoOasis from '@/assets/oasis.webp';
import { CampoContrasena } from '@/components/CampoContrasena';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ApiError } from '@/lib/api-client';
import { useAuthStore } from '@/lib/auth-store';

import { useLogin } from '../hooks';

/** Bienvenida sobre la fotografía del oasis (DESIGN.md, signature) y formulario de 480 px. */
function Bienvenida() {
  return (
    <section
      aria-label="Oasis Seguros"
      className="relative flex min-h-[420px] flex-[1_1_480px] flex-col items-center overflow-hidden bg-sidebar px-4 pt-10 pb-12 text-center sm:min-h-[560px] sm:px-6 sm:pt-[clamp(48px,10vh,120px)] sm:pb-16"
    >
      <img
        src={fotoOasis}
        alt=""
        width={960}
        height={960}
        className="absolute inset-0 size-full object-cover"
      />
      <div aria-hidden="true" className="absolute inset-0 bg-[image:var(--velo-foto)]" />
      <div className="relative isolate flex max-w-[680px] flex-col items-center">
        <div
          aria-hidden="true"
          className="absolute -inset-x-[12%] top-[34%] -bottom-[36%] -z-10 bg-[image:var(--velo-texto)]"
        />
        <img
          src={isologo}
          alt="Oasis Seguros"
          width={236}
          height={236}
          className="aspect-square w-[132px] animate-pop [filter:var(--sombra-isologo)] sm:w-[clamp(150px,17vw,236px)]"
        />
        <p className="mt-[22px] animate-rise font-heading text-display font-bold text-balance text-sidebar-foreground [text-shadow:var(--sombra-texto-foto)] sm:mt-[clamp(28px,5vh,56px)]">
          Bienvenido a Oasis Seguros
        </p>
        <p className="mt-4 animate-rise-tarde text-title text-sidebar-foreground [text-shadow:var(--sombra-texto-foto)]">
          Sus pólizas, cuotas y recibos en un solo lugar.
        </p>
        <span
          aria-hidden="true"
          className="mt-5 h-[3px] w-20 rounded-full bg-[image:var(--gold-gradient)]"
        />
      </div>
    </section>
  );
}

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

  const errores = formulario.formState.errors;

  return (
    <div className="flex min-h-dvh flex-wrap bg-background">
      <Bienvenida />
      <main className="grid flex-[1_1_440px] place-items-center px-4 py-11">
        <form
          className="flex w-full max-w-[480px] animate-formulario flex-col gap-5"
          onSubmit={enviar}
          data-testid="formulario-login"
        >
          <div className="flex flex-col gap-2">
            <h1 className="text-display font-bold">Iniciar sesión</h1>
            <p className="text-base text-muted-foreground">
              Personal de Oasis Seguros y clientes asegurados.
            </p>
          </div>

          {motivoCierre && (
            <p
              role="status"
              data-testid="aviso-cierre"
              className="flex items-start gap-2.5 rounded-md bg-estado-proceso-fondo px-3.5 py-3 text-estado-proceso"
            >
              <Info className="mt-0.5 size-5 shrink-0" aria-hidden="true" />
              {motivoCierre === 'inactividad'
                ? 'Su sesión se cerró por inactividad.'
                : 'Su sesión se cerró. Inicie sesión de nuevo.'}
            </p>
          )}

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="email">Correo electrónico</Label>
            <Input
              id="email"
              type="email"
              autoComplete="username"
              inputMode="email"
              placeholder="nombre@correo.ec"
              className="h-[54px]"
              aria-invalid={errores.email ? true : undefined}
              aria-describedby={errores.email ? 'email-error' : undefined}
              {...formulario.register('email')}
            />
            {errores.email && (
              <p
                id="email-error"
                role="alert"
                className="text-caption font-medium text-destructive"
              >
                {errores.email.message}
              </p>
            )}
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="password">Contraseña</Label>
            <CampoContrasena
              id="password"
              autoComplete="current-password"
              className="h-[54px]"
              aria-invalid={errores.password ? true : undefined}
              aria-describedby={errores.password ? 'password-error' : undefined}
              {...formulario.register('password')}
            />
            {errores.password && (
              <p
                id="password-error"
                role="alert"
                className="text-caption font-medium text-destructive"
              >
                {errores.password.message}
              </p>
            )}
          </div>
          <Button type="submit" size="login" disabled={login.isPending} data-testid="boton-login">
            {login.isPending ? 'Ingresando…' : 'Ingresar'}
          </Button>
          <p className="text-caption text-muted-foreground">
            Después de 5 intentos fallidos en un minuto deberá esperar antes de volver a intentarlo.
            ¿Problemas para ingresar? Comuníquese con el administrador de Oasis Seguros.
          </p>
        </form>
      </main>
    </div>
  );
}
