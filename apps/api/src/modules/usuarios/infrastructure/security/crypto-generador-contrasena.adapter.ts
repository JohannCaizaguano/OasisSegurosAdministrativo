import { randomInt } from 'node:crypto';
import { Injectable } from '@nestjs/common';

import type { GeneradorContrasenaPort } from '../../application/ports/generador-contrasena.port';

const ALFABETO = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
const LONGITUD = 16;

// ponytail: una sola implementación; el puerto existe para inyectar un valor conocido en pruebas.
@Injectable()
export class CryptoGeneradorContrasenaAdapter implements GeneradorContrasenaPort {
  generar(): string {
    return Array.from({ length: LONGITUD }, () => ALFABETO[randomInt(ALFABETO.length)]).join('');
  }
}
