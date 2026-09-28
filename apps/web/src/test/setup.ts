import '@testing-library/jest-dom/vitest';

/**
 * Polyfills que jsdom no implementa y que necesitan los componentes basados en
 * Radix (Select, Dialog, DropdownMenu). Sin ellos, el primer test de render de
 * un componente de estos falla con errores poco descriptivos.
 */
if (!window.matchMedia) {
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: (consulta: string) => ({
      matches: false,
      media: consulta,
      onchange: null,
      addEventListener: () => undefined,
      removeEventListener: () => undefined,
      addListener: () => undefined,
      removeListener: () => undefined,
      dispatchEvent: () => false,
    }),
  });
}

if (!('ResizeObserver' in globalThis)) {
  class ResqueletoResizeObserver implements ResizeObserver {
    observe(): void {}
    unobserve(): void {}
    disconnect(): void {}
  }
  Object.defineProperty(globalThis, 'ResizeObserver', {
    writable: true,
    value: ResqueletoResizeObserver,
  });
}

if (!Element.prototype.hasPointerCapture) {
  Element.prototype.hasPointerCapture = () => false;
}
if (!Element.prototype.setPointerCapture) {
  Element.prototype.setPointerCapture = () => undefined;
}
if (!Element.prototype.releasePointerCapture) {
  Element.prototype.releasePointerCapture = () => undefined;
}
if (!Element.prototype.scrollIntoView) {
  Element.prototype.scrollIntoView = () => undefined;
}
if (!('DOMRect' in globalThis)) {
  // El aserto de null en scrollIntoView no debe romper si falta.
  Object.defineProperty(globalThis, 'DOMRect', {
    writable: true,
    value: class {
      constructor(
        public x = 0,
        public y = 0,
        public width = 0,
        public height = 0,
      ) {}
      top = 0;
      left = 0;
      right = 0;
      bottom = 0;
      toJSON() {
        return this;
      }
    },
  });
}
