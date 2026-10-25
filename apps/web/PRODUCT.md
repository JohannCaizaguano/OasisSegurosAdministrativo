# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

- **Personal administrativo (OPERADOR)** de Oasis Seguros, bróker de seguros de Quito. Trabaja en escritorio durante toda la jornada: registra clientes, pólizas y pagos (de uno en uno o cargando el archivo de cobros que notifica cada aseguradora) y valida o rechaza pagos contra esa notificación. Son tres personas: coordinador administrativo, coordinadora comercial y ejecutiva comercial. Nivel técnico básico–medio.
- **Administrador (ADMIN)**: dos cuentas, la del dueño y gerente del negocio y la del desarrollador del sistema como administrador técnico (confirmado por el autor el 23/10/2026; el backlog v1.5 solo nombra al gerente). Además de lo que hace el operador, gestiona los usuarios del personal y las cuentas de los clientes, reintenta o anula recibos, vigila el saldo de la cuenta de anclaje, administra aseguradoras y catálogos, y consulta la bitácora, los indicadores y los reportes. Ingresa siempre con segundo factor (HU-52).
- **Cliente asegurado (CLIENTE)**: consulta sus pólizas, cuotas, saldo, pagos y recibos; de forma excepcional reporta con comprobante un pago hecho fuera del débito bancario; verifica sus propios recibos. Usa sobre todo el celular. Nivel técnico básico.
- Las aseguradoras no son usuarias: solo son datos de referencia de las pólizas.

## Product Purpose

El Sistema de Registro de Pagos de Primas (SRPP) registra los pagos de primas de Oasis Seguros y emite, por cada pago validado, un recibo digital verificable cuyo hash se ancla en Polygon PoS. Éxito: el operador valida un pago en máximo tres acciones desde el listado, el cliente conoce su situación sin llamar al bróker y cualquier usuario con sesión puede comprobar en segundos si un recibo es auténtico.

## Positioning

Cada recibo de pago de prima es verificable de forma independiente: el contenido queda en la base de datos y su huella en una red pública, sin datos personales en la cadena.

## Operating Context

- Acceso siempre con inicio de sesión (correo y contraseña), desde el botón «Iniciar sesión» del sitio institucional; una sola pantalla redirige según el rol.
- Verificación de recibos solo con sesión activa; el QR del recibo apunta a /recibos/verificar/:codigo y pide iniciar sesión si no hay sesión. El cliente solo verifica sus propios recibos.
- Las primas las cobran las aseguradoras, sobre todo por débito bancario, y notifican al bróker quién está al día. Oasis Seguros no cobra primas: el SRPP no tiene pago en línea.
- Orígenes de un pago: registrado por el personal, cargado desde el archivo de cobros de una aseguradora (en lote, método Débito bancario) o reportado por el cliente con comprobante (PDF, JPG o PNG hasta 5 MB). Todos nacen REGISTRADO.
- El personal valida contra la notificación de la aseguradora o el comprobante; el sistema no se conecta con bancos ni con sistemas de las aseguradoras.
- Ramos: Vida y Asistencia médica (principales); Vehículos, Equipos electrónicos, Aéreo (drones) y Equipos y maquinaria. Aseguradoras: Aseguradora del Sur, Seguros Unidos, Sweaden, Interoceánica; medicina prepagada: Prestasalud y Ecuasanitas. Hoy el seguimiento se lleva en Excel.
- Notificaciones por correo: validación (con enlace al recibo), rechazo (con motivo) y recordatorio de vencimiento.

## Capabilities and Constraints

- Estados del pago: REGISTRADO, VALIDADO, RECHAZADO (estos dos, finales). Rechazar exige motivo.
- Estados del recibo: PENDIENTE_ANCLAJE, ENVIADO, ANCLADO, FALLIDO, ANULADO.
- Estados de la cuota: PENDIENTE, PARCIAL, PAGADA, VENCIDA. Póliza en mora si tiene al menos una cuota vencida.
- Estados de la póliza: VIGENTE, VENCIDA, CANCELADA. Solo se registran pagos sobre pólizas vigentes y el monto no supera el saldo.
- Resultados de verificación: Auténtico, No coincide, En proceso, Anulado, No encontrado.
- Código de verificación del recibo: aleatorio, al menos 10 caracteres, sin revelar información del pago.
- Montos en USD con dos decimales. Interfaz en español; adaptable desde 360 px.
- Stack del frontend: React con Vite (SPA), shadcn/ui, TanStack Query, React Hook Form con Zod, notificaciones con sonner. Backend NestJS.
- Sesión: cierre por inactividad a los 30 minutos con aviso un minuto antes; recuperación de contraseña por enlace de 30 minutos; contraseña temporal que se cambia en el primer ingreso; el cliente acepta la política de tratamiento de datos en su primer ingreso.
- Módulos del personal: panel, clientes (con importación desde Excel/CSV), aseguradoras, pólizas (con cobertura y condiciones) y cuotas, cartera (cuotas por vencer en 7 días y vencidas), pagos (con carga de notificaciones de las aseguradoras), recibos, verificación, reportes (conciliación por aseguradora, cartera vencida), bitácora y usuarios (ADMIN).
- Todo el alcance se planifica en esta entrega: exportar pagos a CSV, recordatorios de vencimiento, catálogos, edición de contacto por el cliente y el panel de indicadores (HU-30) van en los últimos sprints (S7 a S9).
- Diseño de interfaz: de las tres propuestas (A · Sello, B · Claro, C · Cercano) se aprobó como diseño final **Claroscuro**: la estructura de C · Cercano con la paleta negra y dorada del manual de marca (23/10/2026). El sistema visual vive en DESIGN.md y el prototipo navegable en docs/diseno/prototipo/; las pantallas nuevas parten de ellos.

## Brand Commitments

- Manual de marca de Oasis Seguros: negro #1e1e1e, café «Oasis coffe» #6e532a, blanco cálido #f0efed y un degradado dorado (sin valores en el manual). Isologo con palmera dentro de un círculo.
- Tipografías del manual: Harabara Mais Demo para el nombre de marca (licencia demo, sin Ñ en el espécimen) y General Sans para texto.
- Voz: español neutro de Ecuador; trato de «usted» en el portal del cliente; mensajes de error claros y accionables. En la interfaz del cliente y en los avisos del personal no aparecen «blockchain», «hash», «Polygon» ni «anclaje»: se habla de «recibo verificable». El término técnico queda en el bloque de detalle de las pantallas del personal.
- Personalidad: sobria, confiable, clara y cercana.

## Evidence on Hand

- Documentos: ERS v1.6, Documento de Arquitectura v1.5, Historias de usuario y Product Backlog v1.4, Planificación del proyecto y del trabajo de titulación v1.6 (D:\OasisSegurosDocumentacion).
- Manual de marca en PDF e isologo en PNG/SVG (repositorio anterior, docs/Prototipos-UX y public/images).
- No existen todavía datos reales de clientes ni testimonios: toda maqueta usa datos ficticios rotulados como tales.

## Product Principles

1. La tarea del operador manda: validar, registrar y cobrar con el menor número de pasos.
2. Cada estado se entiende sin depender del color: texto, icono y color, y una frase que dice qué significa.
3. El recibo es la prueba: debe poder comprobarse, imprimirse y explicarse sin tecnicismos.
4. El cliente ve primero lo que debe hacer (cuota vencida, pago en validación) y luego el resto.
5. Nada de datos personales donde no hacen falta: ni en la cadena ni en pantallas de verificación.

## Accessibility & Inclusion

WCAG 2.1 AA como requisito del proyecto (RNF-26), con la meta de cumplir 2.2 AA; navegación por teclado, foco visible y objetivos táctiles de al menos 44 px en el portal.
