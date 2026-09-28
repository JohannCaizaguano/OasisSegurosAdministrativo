import { z } from 'zod';

export const ROLES = ['ADMIN', 'OPERADOR', 'CLIENTE'] as const;

export type Rol = (typeof ROLES)[number];

export const rolSchema = z.enum(ROLES);
