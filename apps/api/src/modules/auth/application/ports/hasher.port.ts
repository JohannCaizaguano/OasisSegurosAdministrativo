export const HASHER = Symbol('HasherPort');

export interface HasherPort {
  hashear(textoPlano: string): Promise<string>;
  verificar(hash: string, textoPlano: string): Promise<boolean>;
}
