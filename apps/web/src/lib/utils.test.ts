import { describe, expect, it } from 'vitest';

import { cn } from './utils';

describe('cn con los tokens de Claroscuro', () => {
  it('conserva el tamaño de texto propio junto a un color de texto', () => {
    expect(cn('text-label text-primary-foreground')).toBe('text-label text-primary-foreground');
  });

  it('un tamaño de texto propio reemplaza a otro', () => {
    expect(cn('text-label', 'text-headline')).toBe('text-headline');
  });

  it('una altura de control propia reemplaza a otra', () => {
    expect(cn('min-h-control', 'min-h-login')).toBe('min-h-login');
  });

  it('una sombra propia reemplaza a la de tarjeta', () => {
    expect(cn('shadow-sm', 'shadow-oro')).toBe('shadow-oro');
  });
});
