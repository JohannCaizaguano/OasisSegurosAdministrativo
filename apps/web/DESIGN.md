---
name: SRPP Oasis Seguros · Claroscuro
description: Sistema de diseño final del SRPP: lienzo cálido de día, paneles negros y una sola luz dorada que guía la acción.
colors:
  lienzo-arena: "#f6f4f0"
  papel: "#ffffff"
  arena-hundida: "#efebe4"
  tinta-noche: "#1a1714"
  tinta-tierra: "#5e564b"
  borde-campo: "#8c8478"
  hilo: "#e9e4db"
  cafe-enlace: "#8a6122"
  noche-oasis: "#14110d"
  noche-oasis-alta: "#26201a"
  luna-arena: "#f3ece0"
  arena-tenue: "#a59985"
  oro-oasis: "#f0c878"
  oro-claro: "#f6d592"
  oro-medio: "#e2ad5b"
  oro-profundo: "#c98f3e"
  tinta-sobre-oro: "#1a140c"
  exito: "#2f6b3a"
  exito-fondo: "#eaf4e4"
  proceso: "#2b5c87"
  proceso-fondo: "#e6f0f7"
  aviso: "#8c4f0a"
  aviso-fondo: "#fcefd9"
  error: "#a2332b"
  error-fondo: "#fbe8e4"
  neutro: "#5e564b"
  neutro-fondo: "#efebe4"
typography:
  display:
    fontFamily: "Outfit, system-ui, sans-serif"
    fontSize: "clamp(34px, 3.2vw, 46px)"
    fontWeight: 700
    lineHeight: 1.1
    letterSpacing: "-0.02em"
  headline:
    fontFamily: "Outfit, system-ui, sans-serif"
    fontSize: "30px"
    fontWeight: 700
    lineHeight: 1.15
    letterSpacing: "-0.01em"
  cifra:
    fontFamily: "Outfit, system-ui, sans-serif"
    fontSize: "32px"
    fontWeight: 700
    lineHeight: 1.1
    fontFeature: "\"tnum\" 1"
  title:
    fontFamily: "Outfit, system-ui, sans-serif"
    fontSize: "17px"
    fontWeight: 700
    lineHeight: 1.3
  body:
    fontFamily: "Figtree, system-ui, sans-serif"
    fontSize: "15px"
    fontWeight: 400
    lineHeight: 1.45
  body-movil:
    fontFamily: "Figtree, system-ui, sans-serif"
    fontSize: "16px"
    fontWeight: 400
    lineHeight: 1.5
  label:
    fontFamily: "Figtree, system-ui, sans-serif"
    fontSize: "14px"
    fontWeight: 600
    lineHeight: 1.3
  caption:
    fontFamily: "Figtree, system-ui, sans-serif"
    fontSize: "13px"
    fontWeight: 400
    lineHeight: 1.45
  encabezado-tabla:
    fontFamily: "Figtree, system-ui, sans-serif"
    fontSize: "12.5px"
    fontWeight: 600
    letterSpacing: "0.06em"
rounded:
  sm: "6px"
  md: "8px"
  lg: "12px"
  xl: "16px"
  pill: "999px"
  telefono: "52px"
spacing:
  xs: "6px"
  sm: "10px"
  md: "16px"
  lg: "22px"
  xl: "30px"
  riel: "92px"
components:
  button-primary:
    backgroundColor: "{colors.oro-medio}"
    textColor: "{colors.tinta-sobre-oro}"
    typography: "{typography.label}"
    rounded: "{rounded.md}"
    padding: "0 18px"
    height: "44px"
  button-primary-login:
    backgroundColor: "{colors.oro-medio}"
    textColor: "{colors.tinta-sobre-oro}"
    rounded: "{rounded.md}"
    height: "56px"
  button-secondary:
    backgroundColor: "{colors.papel}"
    textColor: "{colors.tinta-noche}"
    rounded: "{rounded.md}"
    padding: "0 18px"
    height: "44px"
  button-quiet:
    backgroundColor: "{colors.arena-hundida}"
    textColor: "{colors.tinta-noche}"
    rounded: "{rounded.md}"
    padding: "0 18px"
    height: "44px"
  button-danger-outline:
    backgroundColor: "{colors.papel}"
    textColor: "{colors.error}"
    rounded: "{rounded.md}"
    height: "44px"
  button-danger:
    backgroundColor: "{colors.error}"
    textColor: "{colors.papel}"
    rounded: "{rounded.md}"
    height: "44px"
  input:
    backgroundColor: "{colors.papel}"
    textColor: "{colors.tinta-noche}"
    rounded: "{rounded.md}"
    padding: "0 14px"
    height: "48px"
  card:
    backgroundColor: "{colors.papel}"
    rounded: "{rounded.lg}"
    padding: "22px"
  panel-noche:
    backgroundColor: "{colors.noche-oasis}"
    textColor: "{colors.luna-arena}"
    rounded: "{rounded.lg}"
    padding: "20px"
  riel:
    backgroundColor: "{colors.noche-oasis}"
    textColor: "{colors.luna-arena}"
    width: "{spacing.riel}"
  riel-item-activo:
    backgroundColor: "{colors.noche-oasis-alta}"
    textColor: "{colors.oro-oasis}"
    rounded: "{rounded.md}"
  insignia-exito:
    backgroundColor: "{colors.exito-fondo}"
    textColor: "{colors.exito}"
    rounded: "{rounded.pill}"
    padding: "4px 11px 4px 8px"
  insignia-proceso:
    backgroundColor: "{colors.proceso-fondo}"
    textColor: "{colors.proceso}"
    rounded: "{rounded.pill}"
    padding: "4px 11px 4px 8px"
  insignia-aviso:
    backgroundColor: "{colors.aviso-fondo}"
    textColor: "{colors.aviso}"
    rounded: "{rounded.pill}"
    padding: "4px 11px 4px 8px"
  insignia-error:
    backgroundColor: "{colors.error-fondo}"
    textColor: "{colors.error}"
    rounded: "{rounded.pill}"
    padding: "4px 11px 4px 8px"
  insignia-neutra:
    backgroundColor: "{colors.neutro-fondo}"
    textColor: "{colors.neutro}"
    rounded: "{rounded.pill}"
    padding: "4px 11px 4px 8px"
  tab-filtro:
    backgroundColor: "{colors.papel}"
    textColor: "{colors.tinta-noche}"
    rounded: "{rounded.pill}"
    height: "40px"
  tab-filtro-activo:
    backgroundColor: "{colors.tinta-noche}"
    textColor: "{colors.papel}"
    rounded: "{rounded.pill}"
    height: "40px"
---

# Design System: SRPP Oasis Seguros · Claroscuro

## Overview

**Creative North Star: "El oasis al anochecer"**

El SRPP se ve como la fotografía de marca de Oasis Seguros: un lienzo de arena cálida donde se trabaja de día y, sobre él, paneles negros iluminados por una sola luz dorada, la del isologo. La luz no decora: marca lo que la persona tiene que hacer ahora (validar, registrar, reportar) y las cifras que importan sobre fondo negro. Todo lo demás es tinta, arena y espacio.

Es una herramienta de trabajo (modo Operate) para tres operadores y un gerente que validan pagos toda la jornada, y un portal de consulta para clientes que lo abren desde el celular. Por eso la ambición se expresa en precisión: filas de 56 px, controles de 44 px o más, cifras tabulares, estados que se leen sin color y un único gesto de marca repetido con disciplina. La estructura viene de la propuesta C · Cercano (riel de iconos, resumen del día, mesa de validación en dos paneles); la paleta y la forma, del manual de marca: negro, café y el degradado dorado del logo.

Se rechazan de forma explícita los tecnicismos para el cliente y en los avisos («blockchain», «hash», «Polygon», «anclaje»), los degradados y brillos fuera de la acción principal y del riel, el oro como color de texto sobre fondos claros y el texto sobre la fotografía sin un velo medido.

**Key Characteristics:**

- Lienzo de arena (#f6f4f0) con tarjetas de papel y paneles de noche (#14110d) para lo que resume o dirige.
- Una sola acción dorada por vista; el resto de botones son papel, arena o contorno.
- Outfit para títulos y cifras, Figtree para todo lo que se lee; montos siempre con cifras tabulares.
- Estado = texto + icono + color, con cinco tonos para todo el sistema.
- Contraste calculado: texto ≥ 4,5:1, bordes de campo y foco ≥ 3:1.

## Colors

Arena y tinta para trabajar, noche para dirigir la mirada, oro para actuar.

### Primary

- **Oro del oasis** (gradiente de oro claro → oro medio → oro profundo, 135°; plano: oro-oasis): la luz del sistema. Rellena el botón primario de cada vista, colorea el icono y la etiqueta del ítem activo del riel, la insignia de pendientes del riel y las cifras clave dentro de los paneles de noche. Sobre él va siempre la tinta sobre oro (12,9:1 en el extremo claro y 6,5:1 en el profundo).
- **Tinta noche**: texto principal (16,3:1 sobre el lienzo), relleno de la pestaña de filtro activa y color del anillo de foco sobre superficies claras.

### Secondary

- **Café de enlace**: enlaces, migas de pan y acciones de texto («Ver cartera», «¿Olvidó su contraseña?»). Es el café del manual oscurecido para cumplir 5,0:1 sobre el lienzo.

### Neutral

- **Lienzo arena**: fondo de toda la aplicación y del portal. Deriva del blanco cálido del manual de marca (#f0efed), aclarado para que el papel de las tarjetas se distinga; es un compromiso de marca, no un crema por defecto.
- **Papel**: tarjetas, campos, filas y barras inferiores del teléfono.
- **Arena hundida**: botones discretos, fondos de fecha, zona de carga de archivos y notificación de la aseguradora.
- **Tinta tierra**: texto secundario, metadatos y encabezados de tabla (6,6:1 sobre el lienzo).
- **Borde de campo**: borde de 1 px de campos y casillas (3,7:1 sobre papel).
- **Hilo**: separadores de tabla y del recibo; decorativo, nunca el único límite de un control.
- **Noche del oasis** y **noche alta**: riel de navegación, paneles de resumen, héroe del teléfono, barra del prototipo y notificaciones emergentes.
- **Luna de arena** y **arena tenue**: texto principal (16,0:1) y secundario (6,7:1) sobre la noche.

### Estados

Cinco parejas texto/fondo, todas ≥ 5,6:1: éxito (validado, pagada, vigente, verificable), proceso (por validar, en validación, en proceso), aviso (requiere atención, atraso corto, pago antiguo), error (rechazado, vencida, en mora, no encontrado) y neutro (pendiente, anulado).

### Named Rules

**The One Light Rule.** Cada vista tiene como máximo una acción con el oro del oasis. Si dos botones compiten por el oro, uno de ellos pasa a papel o a arena.

**The Gold Stays in the Dark Rule.** El oro como color de texto o de trazo solo aparece sobre la noche (11,9:1). Sobre el lienzo da 1,44:1 y está prohibido para texto, iconos sueltos y foco.

**The Three Signals Rule.** Ningún estado depende solo del color: siempre lleva su texto y su icono, y cada estado usa siempre el mismo icono.

## Typography

**Display Font:** Outfit (con system-ui)
**Body Font:** Figtree (con system-ui)

**Character:** Outfit pone la geometría firme y redonda del isologo en títulos y cifras; Figtree es cálida y muy legible en tamaños de formulario y tabla. Ambas son libres (OFL) y se autoalojan con Fontsource.

### Hierarchy

- **Display** (700, clamp(34px, 3.2vw, 46px), 1,1): solo «Iniciar sesión» y el título sobre la fotografía de bienvenida.
- **Headline** (700, 30px, 1,15): título de cada página del personal («Pagos», «Cartera»); 22px en la cabecera del teléfono.
- **Cifra** (700, 32px, tnum): cifras del resumen del día y montos grandes; 36–40px en el héroe y en los resultados del teléfono.
- **Title** (700, 17px): títulos de tarjeta y de panel.
- **Body** (400, 15px, 1,45): texto de trabajo del escritorio. En el teléfono el cuerpo es 16px.
- **Label** (600, 14px): etiquetas de campo, botones y nombres en filas.
- **Caption** (400, 13px): metadatos de fila, ayudas de campo y avisos legales.
- **Encabezado de tabla** (600, 12.5px, mayúsculas, 0,06em).

### Named Rules

**The Tabular Money Rule.** Todo monto, fecha y código usa cifras tabulares y el formato de Ecuador: $1.234,50 · 06/10/2026.

**The No Hype Rule.** Nada de pesos 800 ni tracking abierto en títulos; la jerarquía sale del tamaño y del espacio.

## Layout

- **Personal (escritorio):** riel de iconos fijo de 92px a la izquierda y área de trabajo fluida con padding de 22px arriba y 30px a los lados. Las páginas abren con una cabecera (título, frase de contexto y acciones a la derecha), luego cifras y, después, listas o tablas. Las rejillas se resuelven con `auto-fit` y `minmax`: cifras de 200px mínimo y columnas de 420px.
- **Densidad:** filas de lista de 56px, filas de tabla con 12px de padding vertical y controles de 44px como mínimo, también en escritorio.
- **Mesa de validación:** dos paneles; el documento (comprobante o notificación de la aseguradora) a la izquierda y la decisión a la derecha, con las acciones al pie.
- **Portal (teléfono):** una columna con padding de 16px, cuerpo de 16px, barra inferior de 4 pestañas (Inicio, Pólizas, Recibos, Cuenta) y un pie fijo con la acción principal del paso.
- **Ingreso:** fotografía del oasis a la izquierda (o arriba en el teléfono) con el isologo, el título y el subtítulo centrados, y el formulario de 480px como máximo sobre el lienzo.
- **Puntos de quiebre:** a 760px el riel pasa a ser una barra superior horizontal con desplazamiento; a 480px el portal ocupa toda la pantalla y la guía del prototipo se oculta. Sin desplazamiento horizontal desde 360px.

### Named Rules

**The Task First Rule.** El inicio del personal abre con lo que hay que hacer (por validar, vence esta semana) y el del cliente con lo urgente (cuota vencida, pago en validación); los gráficos decorativos no tienen lugar.

## Elevation & Depth

La profundidad es híbrida y contenida. Las tarjetas de papel se separan del lienzo con un anillo de 1px y una sombra ambiental muy baja; los paneles de noche se elevan con un filo dorado interior y una sombra más marcada, como una lámpara sobre la mesa. No hay cristal, desenfoques ni brillos animados.

### Shadow Vocabulary

- **Tarjeta** (`box-shadow: 0 0 0 1px #ebe6dd, 0 4px 16px rgba(26,23,20,.05)`): tarjetas, filas de lista, pestañas de filtro y botones secundarios.
- **Panel de noche** (`box-shadow: inset 0 0 0 1px rgba(240,200,120,.25), 0 10px 28px rgba(20,17,13,.18)` sobre `radial-gradient(120% 130% at 0% 0%, rgba(240,200,120,.22), transparent 60%)`): cifra «Por validar», resumen de póliza, héroe del portal.
- **Acción dorada** (`box-shadow: inset 0 1px 0 rgba(255,255,255,.4), 0 2px 6px rgba(26,20,12,.16)`): botón primario; en el ingreso, `inset 0 1px 0 rgba(255,255,255,.45), 0 4px 14px rgba(26,20,12,.16)`. La sombra es neutra: el oro está en el relleno, nunca en un halo.
- **Flotante** (`box-shadow: 0 24px 60px rgba(20,17,13,.28)`): diálogos, notificaciones y el marco del teléfono.

### Named Rules

**The Lamp Rule.** Solo los paneles de noche llevan el filo dorado. Una tarjeta de papel nunca brilla.

## Shapes

Esquinas suaves y contenidas: 6px en elementos pequeños (fecha, botón «Mostrar»), 8px en botones, campos y filas, 12px en tarjetas y paneles, 16px en contenedores grandes y píldora en insignias, pestañas de filtro y chips. Los avatares e iconos de notificación son círculos. Los bordes de 1px solo delimitan campos; la separación entre bloques sale del espacio y de la sombra. El comprobante de pago se muestra como una hoja con un giro de -0,6° para distinguir el documento del cliente de la interfaz.

## Components

### Buttons

- **Shape:** esquina suave (8px), altura mínima de 44px (52px en acciones grandes y 56px en «Ingresar»), padding horizontal de 18px, etiqueta en 600.
- **Primary:** gradiente del oro del oasis con tinta sobre oro y la sombra de acción dorada. Al pasar el cursor, `filter: brightness(1.06)`; al presionar, `scale(.97)` en 120–150ms.
- **Secondary:** papel con la sombra de tarjeta y tinta noche («Ver cartera», «Cargar notificación»).
- **Quiet:** arena hundida con tinta noche («Cancelar», «Revisar», «Recordar»).
- **Danger:** contorno rojo de 1,5px sobre papel para abrir un rechazo; rojo sólido con texto blanco (6,9:1) solo para confirmar lo que no se deshace («Rechazar pago», «Anular recibo»).
- **Link:** café de enlace en 600, subrayado con desplazamiento de 3px cuando está fuera de una lista.
- **Disabled:** 45% de opacidad y cursor no permitido; nunca se oculta una acción, se explica por qué no está disponible.

### Chips

- **Style:** píldora de 36px con borde de 1px y fondo de papel; seleccionado, tinta noche con texto blanco y `aria-pressed`.
- **Uso:** motivos frecuentes de rechazo y selector de póliza en el teléfono.

### Cards / Containers

- **Corner Style:** 12px.
- **Background:** papel sobre el lienzo; noche del oasis para resúmenes y héroes.
- **Shadow Strategy:** tarjeta o panel de noche (ver Elevation & Depth).
- **Border:** ninguno; el anillo de 1px forma parte de la sombra.
- **Internal Padding:** 18–22px en escritorio y 16–18px en el teléfono.

### Inputs / Fields

- **Style:** papel, borde de 1px de campo, 8px de esquina, 48px de alto (54px en el ingreso), texto de 16px para que el teléfono no haga zoom.
- **Focus:** borde de 2px en tinta noche y anillo de 4px `rgba(226,173,91,.38)`; el padding se compensa 1px para que el texto no salte.
- **Ayuda:** caption en tinta tierra bajo el campo, siempre visible (no un placeholder ni un tooltip), que dice qué se espera y qué regla aplica antes de que el usuario se equivoque («Solo aparecen pólizas vigentes.», «No se repite en la misma póliza.»). Se enlaza con `aria-describedby`; si hay error, el campo describe ambos, primero la ayuda.
- **Error:** borde de 2px rojo y mensaje bajo el campo con el valor permitido («Supera el saldo pendiente ($518,40).»), enlazado al campo y anunciado con `role="alert"`.
- **Archivo:** zona de arena hundida con icono en una casilla de papel, el formato permitido (PDF, JPG o PNG hasta 5 MB) y el nombre del archivo elegido.

### Navigation

- **Riel del personal:** noche del oasis, 92px, isologo arriba, ítems de 56px con icono de 22px en arena tenue y etiqueta de 12px. El ítem activo usa la noche alta con texto e icono en oro, sin filos laterales. La insignia de pendientes es una píldora dorada. El avatar del usuario abre su menú al pie: un círculo de 44px, también en la barra superior bajo 760px (un botón del riel no le presta su alto de 56px).
- **Barra inferior del teléfono:** papel con un hilo superior, 4 pestañas con icono de 22px y etiqueta de 12px; la activa va en café de enlace y 700.
- **Migas de pan:** «Pagos / Mesa de validación», con el tramo anterior como enlace.

### Administración

- **Ítems del riel:** el administrador ve además «Reportes» y «Admin.»; la píldora dorada de «Admin.» cuenta los recibos fallidos y la alerta de saldo. El operador ve «Reportes» sin la cartera vencida.
- **Pestañas del hub:** píldoras de filtro (Usuarios, Anclaje de recibos, Bitácora, Aseguradoras y catálogos, Seguridad); la de anclaje suma sus alertas en el texto, no solo con color.
- **Etiqueta de rol:** rectángulo de 6px; «Administrador» en oro del oasis sobre la noche (11,9:1) y «Operador» en tinta sobre arena hundida. El rol no es un estado, por eso no usa píldora ni icono.
- **Salud del anclaje:** panel de noche con el saldo en cifra dorada de 40px, una barra contra el umbral (rojo claro #f3a59d, 9,6:1, cuando está por debajo), tres cifras pequeñas y un aviso con icono si el saldo baja del umbral.
- **Línea de tiempo del anclaje:** puntos de 24px con icono: éxito para lo completado, proceso para lo que espera, error para el envío fallido, neutro para lo pendiente o anulado.
- **Interruptor:** 46×28px dentro de una fila de 52px, `role="switch"` con `aria-checked`; activo en éxito y apagado en borde de campo. Se usa para activar o desactivar catálogos, nunca para borrar.
- **Código de un solo uso:** campo de 60px con Outfit de 26px, espaciado de 0,5em y centrado, `inputmode="numeric"` y `autocomplete="one-time-code"`.
- **Códigos de recuperación:** rejilla de dos columnas en monoespaciada sobre arena hundida, precedida de un aviso que dice que no se volverán a mostrar.

### Insignias de estado

Píldora con icono de 14px y texto de 13px en 600 sobre el fondo de su tono. Vocabulario: Por validar · Validado · Rechazado; En proceso · Verificable · Requiere atención · Anulado; Pendiente · Pago parcial · Pagada · Vencida; Vigente · Vencida · Cancelada · En mora; Auténtico · No coincide · No encontrado; para cuentas, Activo · Desactivado · Pendiente de primer ingreso · Sin cuenta, y para el segundo factor, Activo · Por activar.

Cada estado tiene además una descripción de una frase, en «usted» y sin jerga técnica («El pago fue confirmado y tiene un recibo verificable.»). Vive junto al texto y al icono en `src/components/estados.ts` y el tipo la exige: la leyenda, el portal y la verificación leen la misma fuente.

### Leyenda de estados

- **Forma:** `<details>` nativo sobre arena hundida, con el resumen «¿Qué significa cada estado?» como enlace café (44px de alto) y un chevron que rota 180° al abrirse. Dentro, cada insignia con su descripción en tinta tierra, en dos columnas desde 640px.
- **Dónde:** bajo los filtros de toda lista con estados (Pagos, Recibos) o al pie de la tabla (Pólizas). Muestra cada texto una vez: los estados que comparten texto («En proceso») no se repiten.
- **Sin tooltips sobre la insignia:** el `hover` no existe en el teléfono y un tooltip no se abre con el teclado sin código propio; `<details>` funciona en ambos sin dependencias.

### Ramo

Icono lucide de 16px con `aria-hidden` seguido del nombre del ramo (`RamoEtiqueta`). El icono sale del código del ramo, no del nombre, para que renombrar un ramo no le quite el suyo; un código sin icono propio usa el escudo. El icono nunca va solo: el nombre es el dato accesible.

### Estados vacíos

Icono de bandeja, título en 600 («Sin recibos todavía»), una frase que explica por qué está vacío o qué lo llenará («Cada pago validado emite un recibo.») y, si hay algo que hacer, una acción: un enlace («Ir a Pagos») o un botón secundario pequeño («Quitar filtro»). Una lista vacía por un filtro siempre ofrece quitarlo. Sin acción ni descripción, el título solo va en tinta tierra.

### Cifras que filtran

Una cifra del inicio lleva a la lista que la compone, ya filtrada: «Por validar» abre Pagos con el filtro «Registrados» (`/pagos?estado=REGISTRADO`). El filtro vive en la URL, así que la vista se puede recargar y compartir; cambiarlo reemplaza la entrada del historial en lugar de sumar una.

### Seguimiento del pago (portal)

Lista ordenada de tres pasos bajo cada pago del cliente, con los puntos de 24px de la línea de tiempo: «Registrado» (éxito), «En revisión por Oasis Seguros» (proceso mientras espera) y el final, «Validado · recibo verificable» (éxito) o «Rechazado» (error, con el motivo debajo); mientras no hay resultado, el último paso es neutro. Cada paso dice su estado en texto («Completado», «En curso», «Pendiente») y su fecha como dd/mm/aaaa, sin hora. Responde «¿qué pasó con mi pago?» sin llamar al bróker.

### En mora (portal)

Una póliza con una cuota vencida suma la insignia «En mora» junto a la de su estado y, debajo, una frase en rojo de error que dice qué hacer: «Tiene una cuota vencida. Comuníquese con Oasis Seguros para ponerse al día.»

### Mesa de validación (signature)

El documento a la izquierda: la hoja del comprobante del cliente o la notificación de la aseguradora (archivo, fila, fecha de cobro, referencia y monto sobre arena hundida). Debajo, las comprobaciones automáticas con su icono. A la derecha, los datos del pago, «Rechazar» en contorno rojo y «Validar y emitir recibo» en oro. Rechazar despliega en el mismo panel los chips de motivo y el mensaje para el cliente, que es obligatorio.

### Héroe del portal (signature)

Panel de noche con la insignia de estado, el ramo y la cuota, el monto en oro con cifra de 36px, una frase que dice qué pasó y qué hacer, y dos acciones: la dorada y una con contorno claro sobre la noche.

### Bienvenida sobre fotografía (signature)

Isologo de 150–236px, título display y subtítulo centrados sobre la foto del oasis, con un velo vertical y un velo radial oscuro detrás del texto. El contraste se mide sobre el peor píxel de la foto: el título ≥ 3:1 (texto grande) y el subtítulo ≥ 4,5:1 en 1440, 1280 y 390px. Una barra de 80×3px con el gradiente dorado cierra el bloque.

## Do's and Don'ts

### Do:

- **Do** usar el gradiente del oro del oasis solo en el botón primario; el oro plano, en el ítem activo y la insignia de pendientes del riel.
- **Do** tematizar lo que dibuja el navegador: selección en oro del oasis con tinta sobre oro, cursor de texto y `accent-color` en tinta noche, barras de desplazamiento en arena tenue y subrayado con desplazamiento de 3px.
- **Do** usar migas de pan solo en subpáginas («Pagos / Mesa de validación»); una página principal no repite su título encima del título.
- **Do** poner el foco como contorno de 3px en tinta noche con 2px de separación sobre superficies claras, y en oro del oasis dentro del riel, los paneles de noche y las notificaciones.
- **Do** acompañar cada estado de su texto y su icono, con los cinco tonos de estado y nada más.
- **Do** escribir montos con cifras tabulares y formato de Ecuador ($1.234,50) y fechas como dd/mm/aaaa.
- **Do** mantener todo objetivo táctil en 44px o más y el cuerpo del teléfono en 16px.
- **Do** respetar `prefers-reduced-motion`: se quitan desplazamientos y escalados y se conservan los cambios de opacidad y color.
- **Do** hablarle al cliente de «recibo verificable», «en proceso» y «se está registrando para que pueda verificarse».
- **Do** decir la consecuencia antes de una acción que no se deshace («El cliente lo verá en su portal. La acción no se puede deshacer.») y por qué un control no está disponible («Solo lectura: la póliza ya no está vigente»).
- **Do** explicar cada estado con la leyenda y cada lista vacía con su motivo y su acción.

### Don't:

- **Don't** usar el oro del oasis como color de texto, icono o foco sobre el lienzo o el papel (1,44:1).
- **Don't** poner dos acciones doradas en la misma vista.
- **Don't** escribir texto sobre la fotografía sin el velo medido, ni usar la fotografía fuera de la bienvenida.
- **Don't** añadir grises, azules o acentos nuevos: los neutros son arena y tinta, y el azul solo existe como tono de «proceso».
- **Don't** usar cristal, desenfoque, halos de color, brillos animados ni `transition: all`; se animan solo transform y opacity. Las respuestas a una acción duran menos de 300ms; las entradas del prototipo (bienvenida de 0,6–0,8s, vista de 0,35s y filas escalonadas de 30–35ms) se conservan y nunca bloquean la interacción. El catálogo está en las utilidades `animate-*` de `src/index.css`.
- **Don't** escribir «blockchain», «hash», «Polygon» ni «anclaje» en lo que ve el cliente ni en los avisos, diálogos y notificaciones del personal. El detalle técnico (hash, transacción, red y explorador) vive solo en su bloque de las pantallas del personal.
- **Don't** explicar un estado con un tooltip sobre la insignia.
- **Don't** usar el rojo sólido para acciones que se pueden deshacer.
- **Don't** marcar ítems, tarjetas ni avisos con bordes laterales de color de más de 1px.
- **Don't** mostrar al operador lo que es solo del administrador (saldo de la cuenta de anclaje, reintentar, anular, usuarios, bitácora): se oculta, no se deshabilita.
