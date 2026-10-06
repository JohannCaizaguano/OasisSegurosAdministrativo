import type { NextFunction, Request, Response } from 'express';

/**
 * Ninguna respuesta del API queda en la caché del navegador (HU-02: "atrás" no muestra datos).
 * Es middleware y no interceptor para cubrir también los 401, 403 y 429 de los guards.
 */
export function sinCache(_peticion: Request, respuesta: Response, siguiente: NextFunction): void {
  respuesta.setHeader('Cache-Control', 'no-store');
  siguiente();
}
