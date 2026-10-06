import type { DynamicModule, Type } from '@nestjs/common';
import { RequestMethod } from '@nestjs/common';
import { METHOD_METADATA, MODULE_METADATA, PATH_METADATA } from '@nestjs/common/constants';
import type { Rol } from '@oasis/shared';

import { AppModule } from '../src/app.module';
import { IS_PUBLIC_KEY, ROLES_KEY } from '../src/common/auth/decorators';

export interface RutaDeclarada {
  /** `Controlador.handler`, como en la cobertura de @Auditar. */
  clave: string;
  metodo: RequestMethod;
  /** Ruta completa con el prefijo global (salvo /metrics). */
  ruta: string;
  esPublica: boolean;
  roles: Rol[];
  handler: (...args: unknown[]) => unknown;
}

/** Controladores registrados en el grafo de módulos, sin instanciar nada. */
export function controladores(raiz: Type<unknown> = AppModule): Type<unknown>[] {
  const visitados = new Set<unknown>();
  const encontrados = new Set<Type<unknown>>();

  const visitar = (importado: unknown): void => {
    if (!importado || visitados.has(importado) || importado instanceof Promise) {
      return;
    }
    // `forwardRef(() => Modulo)` envuelve el módulo en un objeto: se resuelve para no dejar rutas fuera.
    if (typeof importado === 'object' && 'forwardRef' in importado) {
      visitados.add(importado);
      visitar((importado as { forwardRef: () => unknown }).forwardRef());
      return;
    }
    visitados.add(importado);
    const dinamico =
      typeof importado === 'object' && 'module' in importado
        ? (importado as DynamicModule)
        : undefined;
    const clase = dinamico ? dinamico.module : importado;
    if (typeof clase !== 'function') {
      return;
    }
    const propios = (Reflect.getMetadata(MODULE_METADATA.CONTROLLERS, clase) ??
      []) as Type<unknown>[];
    for (const controlador of [...propios, ...(dinamico?.controllers ?? [])]) {
      encontrados.add(controlador);
    }
    const hijos = (Reflect.getMetadata(MODULE_METADATA.IMPORTS, clase) ?? []) as unknown[];
    for (const hijo of [...hijos, ...(dinamico?.imports ?? [])]) {
      visitar(hijo);
    }
  };

  visitar(raiz);
  return [...encontrados];
}

export function rutasDeclaradas(raiz: Type<unknown> = AppModule): RutaDeclarada[] {
  return controladores(raiz).flatMap((controlador) => {
    const base = String(Reflect.getMetadata(PATH_METADATA, controlador) ?? '');
    return Object.getOwnPropertyNames(controlador.prototype).flatMap((nombre) => {
      const handler = Object.getOwnPropertyDescriptor(controlador.prototype, nombre)?.value as
        RutaDeclarada['handler'] | undefined;
      const metodo =
        typeof handler === 'function'
          ? (Reflect.getMetadata(METHOD_METADATA, handler) as RequestMethod | undefined)
          : undefined;
      if (!handler || metodo === undefined) {
        return [];
      }
      const subruta = String(Reflect.getMetadata(PATH_METADATA, handler) ?? '');
      const segmentos = [base, subruta].filter((s) => s.length > 0 && s !== '/');
      const prefijo = base === 'metrics' ? '' : '/api/v1';
      return [
        {
          clave: `${controlador.name}.${nombre}`,
          metodo,
          ruta: `${prefijo}/${segmentos.join('/')}`.replace(/\/+/g, '/'),
          esPublica: Boolean(
            Reflect.getMetadata(IS_PUBLIC_KEY, handler) ??
            Reflect.getMetadata(IS_PUBLIC_KEY, controlador),
          ),
          roles: (Reflect.getMetadata(ROLES_KEY, handler) ??
            Reflect.getMetadata(ROLES_KEY, controlador) ??
            []) as Rol[],
          handler,
        },
      ];
    });
  });
}
