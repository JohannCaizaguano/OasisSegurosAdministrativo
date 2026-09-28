import { PipeTransform, Injectable } from '@nestjs/common';
import { Body, Param, Query } from '@nestjs/common';
import { z } from 'zod';

import { ValidacionError } from '../../shared-kernel/domain-error';

@Injectable()
export class ZodValidationPipe<T> implements PipeTransform<unknown, T> {
  constructor(private readonly schema: z.ZodType<T>) {}

  transform(value: unknown): T {
    const resultado = this.schema.safeParse(value);
    if (!resultado.success) {
      throw new ValidacionError('Datos inválidos', resultado.error.issues);
    }
    return resultado.data;
  }
}

export const ZodBody = <T>(schema: z.ZodType<T>) => Body(new ZodValidationPipe(schema));
export const ZodQuery = <T>(schema: z.ZodType<T>) => Query(new ZodValidationPipe(schema));
export const ZodParam = <T>(schema: z.ZodType<T>) => Param(new ZodValidationPipe(schema));
/**
 * Igual que `ZodParam`, pero para un parámetro de ruta concreto: devuelve solo
 * ese campo ya validado, no el objeto de parámetros completo.
 */
export const ZodParamCampo = <T>(campo: string, schema: z.ZodType<T>) =>
  Param(campo, new ZodValidationPipe(schema));
