# Diseño de interfaz · Claroscuro

Diseño final de la SPA, aprobado el 23/10/2026 ([ADR-019](../adr/ADR-019-diseno-interfaz-claroscuro.md)).
Lo implementa HT-13.

| Pieza                                                                        | Para qué                                                                                                                                              |
| ---------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------- |
| [`apps/web/DESIGN.md`](../../apps/web/DESIGN.md)                             | Fuente normativa: tokens, tipografía, forma, componentes y reglas.                                                                                    |
| [`apps/web/.impeccable/design.json`](../../apps/web/.impeccable/design.json) | Sidecar de impeccable: rampas tonales, sombras, movimiento y componentes de referencia.                                                               |
| [`apps/web/PRODUCT.md`](../../apps/web/PRODUCT.md)                           | Contexto del producto que lee impeccable.                                                                                                             |
| [`prototipo/index.html`](prototipo/index.html)                               | Prototipo navegable (administración, operación y asegurado, con datos compartidos). Se abre directo en el navegador.                                  |
| [`SRPP-diseno-final-claroscuro.pdf`](SRPP-diseno-final-claroscuro.pdf)       | Documento de 39 páginas: reglas, estados, color con contraste calculado y cada pantalla (administración, operación y asegurado) con su justificación. |

Si DESIGN.md y el prototipo discrepan, gana DESIGN.md. El prototipo no es código de producción:
sirve de referencia visual y de comportamiento.

## Tokens para `apps/web/src/index.css`

Correspondencia de los roles de DESIGN.md con las variables de shadcn/ui. Los valores van en hex,
como en DESIGN.md.

```css
@import '@fontsource-variable/outfit';
@import '@fontsource-variable/figtree';

:root {
  --background: #f6f4f0; /* lienzo arena */
  --foreground: #1a1714; /* tinta noche */
  --card: #ffffff;
  --card-foreground: #1a1714;
  --popover: #ffffff;
  --popover-foreground: #1a1714;
  --primary: #e2ad5b; /* oro medio; el botón usa --gold-gradient */
  --primary-foreground: #1a140c;
  --secondary: #efebe4;
  --secondary-foreground: #1a1714;
  --muted: #efebe4;
  --muted-foreground: #5e564b;
  --accent: #efebe4;
  --accent-foreground: #1a1714;
  --destructive: #a2332b;
  --destructive-foreground: #ffffff;
  --border: #e9e4db;
  --input: #8c8478;
  --ring: #1a1714;
  --link: #8a6122;
  --sidebar: #14110d;
  --sidebar-foreground: #f3ece0;
  --sidebar-muted: #a59985;
  --sidebar-primary: #f0c878;
  --sidebar-primary-foreground: #1a140c;
  --sidebar-accent: #26201a;
  --gold-gradient: linear-gradient(135deg, #f6d592 0%, #e2ad5b 55%, #c98f3e 100%);
  --night-glow: radial-gradient(120% 130% at 0% 0%, rgb(240 200 120 / 0.22), transparent 60%);
  --estado-exito: #2f6b3a;
  --estado-exito-fondo: #eaf4e4;
  --estado-proceso: #2b5c87;
  --estado-proceso-fondo: #e6f0f7;
  --estado-aviso: #8c4f0a;
  --estado-aviso-fondo: #fcefd9;
  --estado-error: #a2332b;
  --estado-error-fondo: #fbe8e4;
  --estado-neutro: #5e564b;
  --estado-neutro-fondo: #efebe4;
}

@theme inline {
  --font-sans: 'Figtree Variable', system-ui, sans-serif;
  --font-heading: 'Outfit Variable', system-ui, sans-serif;
  --radius-sm: 6px;
  --radius-md: 8px;
  --radius-lg: 8px; /* botones y campos */
  --radius-xl: 12px; /* tarjetas y diálogos */
  --radius-2xl: 16px;
  --radius-4xl: 9999px; /* insignias */
  /* además, cada variable de :root se registra como --color-<nombre>: var(--<nombre>) */
}

@theme {
  --shadow-sm: 0 0 0 1px #ebe6dd, 0 4px 16px rgb(26 23 20 / 0.05); /* tarjeta */
  --shadow-lg: 0 24px 60px rgb(20 17 13 / 0.28); /* flotante */
}
```

Además de los tokens, el sistema necesita estos ajustes:

- **Foco:** contorno de 3 px en `--ring` con 2 px de separación; dentro del riel y de los paneles de
  noche, en `--sidebar-primary`. Los campos usan borde de 2 px en tinta con halo
  `0 0 0 4px rgb(226 173 91 / 0.38)`.
- **Superficies del navegador:** `::selection` en `#f0c878` con `#1a140c`, `caret-color` y
  `accent-color` en tinta, `scrollbar-color: #a59985 transparent`, subrayado con
  `text-underline-offset: 3px`.
- **Alturas:** botones de 44 px (`h-11`), campos de 48 px (`h-12`), filas de lista de 56 px.

## Orden de implementación (HT-13)

1. Tokens, fuentes y superficies del navegador en `index.css`.
2. Variantes de `button`, `input`, `select`, `badge` (cinco tonos de estado con icono), `card`,
   `table`, `tabs`, `dialog`, `alert-dialog`, `sheet` y el `Toaster` de sonner, con sus pruebas
   de Vitest.
3. `components/layout/AppLayout.tsx`: riel de 92 px en la noche con el activo en oro y la píldora
   de pendientes.
4. Ingreso (`features/auth`) con la fotografía y el velo; `logo.png` y `oasis.jpg` pasan a
   `apps/web/src/assets/`.
5. Páginas existentes sobre los primitivos nuevos, sin cambiar su lógica.

Para revisar una pantalla: `impeccable detect <archivo>` desde `apps/web`. El hallazgo
`cream-palette` sobre `#f6f4f0` se acepta, porque el lienzo deriva del blanco cálido del manual
(`#f0efed`).
