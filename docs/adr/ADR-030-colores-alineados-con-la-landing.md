# ADR-030 · Colores del sistema alineados con la landing

- **Estado**: aceptado (implementación pendiente: fase de diseño del S5)
- **Fecha**: 2026-11
- **Sprint**: S5

## Contexto

El sistema (ADR-019) y la landing de Oasis Seguros comparten la familia hueso, negro y dorado, pero
con tonos distintos: lienzo `#f6f4f0` frente a `#f0efed`, negro `#14110d` frente a `#1e1e1e`, dorado
sobre noche `#f0c878` frente a `#e2bf7d`. La diferencia mayor es el botón principal sobre fondo
claro: la landing usa tinta y reserva el dorado metálico para los fondos negros; el sistema usaba
dorado sobre claro. Al pasar de un sitio al otro el producto se sentía distinto.

## Decisión

Se adopta la propuesta B («Misma tarjeta»):

- Los tokens de `apps/web/src/index.css` toman los valores de la landing: lienzo `#f0efed`, tinta y
  noche `#1e1e1e`, tinta suave `#57514a`, enlace `#8a6630`, dorado sobre noche `#e2bf7d`, error
  `#a1452c`, líneas doradas al 26 % y el gradiente metálico horizontal.
- El botón `primary` pasa a tinta con texto blanco, y aparece el botón `dorado`, que solo se usa
  sobre un panel de noche (héroe del portal). La regla «una luz dorada por vista» se reemplaza por
  «la tinta actúa, el oro ilumina la noche» (`DESIGN.md`).
- Los contrastes de `DESIGN.md` se recalcularon; el enlace sobre el lienzo queda en 4,5:1.

## Alternativas descartadas

- **Fondo blanco puro como el de la landing**: la landing es blanca y usa el hueso solo en Contacto y
  en placas. Se midió (el hueso es el más gris, calidez b* 1,1, frente a 2,1 de la arena) y se
  probaron blanco con placas hueso, blanco con tarjetas blancas y arena. Se mantiene el hueso
  `#f0efed` como fondo de trabajo.

- **A · Ajuste fino**: acerca los textos y los dorados pero deja lienzo, negro y botón distintos.
- **C · Un solo juego**: suma lámina dorada, hilo dorado y General Sans; exige tipografía nueva y un
  cuarto uso del dorado, y queda fuera del alcance del sprint.

## Consecuencias

- Positivas: el salto de la landing al ingreso no cambia de fondo, de negro ni de botón; todo el
  color sigue en un solo bloque de tokens.
- Negativas: el código (`index.css`, `button.tsx`) conserva la paleta anterior hasta la fase de
  diseño del S5. El hueso exacto separa menos el lienzo del papel, así que las tarjetas dependen del
  anillo y la sombra.
