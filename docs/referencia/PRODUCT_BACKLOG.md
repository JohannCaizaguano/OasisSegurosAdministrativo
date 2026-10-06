# Historias de usuario y Product Backlog — SRPP (Oasis Seguros)

> Fuente de verdad del alcance funcional. Versión 1.1 (06/10/2026): usuarios limitados al personal de Oasis Seguros y a sus clientes con inicio de sesión (HU-28 sin acceso público) y pago en línea con PayPhone (HU-48 y HU-49). Los IDs de requisitos (RF-xx, RNF-xx) y reglas de negocio (RN-xx) provienen de la ERS del proyecto; aquí solo se citan por su ID.

Sistema de Registro de Pagos de Primas (SRPP) — Scrum con sprints semanales

**Cliente:** Oasis Seguros

**Elaborado por:** Johann Awki Caizaguano Chicaiza

**Supervisión:** Ing. Diego Alejandro García Saraguro

**Fecha:** 7 de septiembre de 2026

Documento elaborado en el marco del proyecto técnico de titulación de la Carrera de Software, Escuela Superior Politécnica de Chimborazo.

## 1. INTRODUCCIÓN

El Product Backlog del SRPP contiene 61 elementos: 49 historias de usuario y 12 historias técnicas, con un total de 385 horas estimadas.

- **Periodo:** 18 sprints semanales, del 7 de septiembre de 2026 al 8 de enero de 2027.
- **Capacidad:** 25 horas por semana y 15 horas en las semanas con feriado (420 horas en total).
- **Reserva:** 35 horas libres, con el Sprint 17 dedicado a correcciones y reserva.

La columna Requisitos del Product Backlog indica los requisitos de la ERS que implementa cada historia.

### 1.1. Roles del equipo Scrum

**Tabla 1-1:** Roles del equipo Scrum

| Rol Scrum | Responsable | Responsabilidades |
| --- | --- | --- |
| Product Owner | Representante de Oasis Seguros (por confirmar) | Prioriza el backlog, acepta o rechaza los incrementos en la revisión semanal |
| Scrum Master | Ing. Diego Alejandro García Saraguro (supervisor del proyecto) | Facilita las ceremonias, elimina impedimentos y vela por el proceso |
| Equipo de desarrollo | Johann Awki Caizaguano Chicaiza | Diseña, construye, prueba y despliega el sistema; mantiene la documentación |

## 2. CONVENCIONES DEL BACKLOG

### 2.1. Formato de las historias

- **Plantilla:** "Como <rol>, quiero <funcionalidad>, para <beneficio>".
- **Criterios INVEST:** independiente, negociable, valiosa, estimable, pequeña y verificable.
- **Historias técnicas (HT):** misma plantilla, con el desarrollador, el evaluador o el bróker como rol.
- **Criterios de aceptación:** se comprueban en la revisión del sprint.

### 2.2. Estimación y prioridad

Estimación en horas ideales de trabajo. Prioridad en tres niveles, equivalentes a la priorización MoSCoW de la ERS.

**Tabla 2-1:** Correspondencia de prioridades

| Prioridad del backlog | Prioridad MoSCoW en el ERS | Significado |
| --- | --- | --- |
| ALTA | Must | Sin ella el sistema no cumple su objetivo |
| MEDIA | Should | Importante, pero el sistema funciona sin ella |
| BAJA | Could | Deseable si el tiempo lo permite |

### 2.3. Definición de Listo y Definición de Terminado

**Definición de Listo.** Una historia entra en un sprint cuando:

- Tiene descripción, criterios de aceptación y estimación.
- Sus dependencias están terminadas o se completan en el mismo sprint.
- El Product Owner la comprende y la priorizó.

**Definición de Terminado.** Una historia está terminada cuando:

- Cumple todos sus criterios de aceptación.
- Tiene pruebas automatizadas y la integración continua está en verde (lint, pruebas, dependency-cruiser).
- El código está integrado en la rama principal mediante pull request.
- Funciona en el entorno de desarrollo con Docker Compose.
- La documentación afectada (API, README, manuales) está actualizada.
- El Product Owner la aceptó en la revisión del sprint.

## 3. ÉPICAS

Las historias se agrupan en 9 épicas.

**Tabla 3-1:** Épicas del Product Backlog

| ID | Épica | Alcance | Historias | Horas |
| --- | --- | --- | --- | --- |
| EP-01 | Acceso y seguridad | Autenticación, roles y cuentas | 9 | 38 |
| EP-02 | Gestión de clientes | Registro y consulta de clientes | 5 | 27 |
| EP-03 | Pólizas, cuotas y cartera | Pólizas, plan de cuotas, vencimientos y catálogos | 11 | 48 |
| EP-04 | Gestión de pagos | Registro, validación, consulta y pago en línea de primas | 9 | 51 |
| EP-05 | Recibos y blockchain | Emisión, anclaje, anulación y estado de recibos | 9 | 67 |
| EP-06 | Portal del cliente y verificación | Autoservicio del cliente y verificación de recibos con sesión | 4 | 27 |
| EP-07 | Plataforma e infraestructura | Monorepo, bases técnicas, contenedores y despliegue | 7 | 68 |
| EP-08 | Evaluación y entrega | Pruebas de aceptación, rendimiento, capacitación y entrega | 4 | 42 |
| EP-09 | Reportes y auditoría | Reportes de conciliación, cartera vencida y bitácora | 3 | 17 |
|  | Total |  | 61 | 385 |

## 4. PRODUCT BACKLOG

Product Backlog ordenado por sprint.

**Tabla 4-1:** Product Backlog del SRPP

| ID | Historia | Épica | Prioridad | Horas | Depende de | Requisitos | Sprint |
| --- | --- | --- | --- | --- | --- | --- | --- |
| HT-01 | Configuración del monorepo e integración continua | EP-07 | ALTA | 10 | N/A | — | S1 |
| HT-03 | Base del backend con arquitectura hexagonal | EP-07 | ALTA | 12 | HT-01 | RNF-17 | S1 |
| HT-02 | Contrato inteligente RegistroRecibos | EP-05 | ALTA | 18 | HT-01 | RNF-07, RNF-14 | S2 |
| HU-45 | Bitácora de auditoría | EP-09 | MEDIA | 6 | HT-03 | RF-50, RNF-27 | S2 |
| HU-01 | Iniciar sesión | EP-01 | ALTA | 8 | HT-03 | RF-01, RF-03 | S3 |
| HU-02 | Cerrar sesión | EP-01 | ALTA | 3 | HU-01 | RF-02 | S3 |
| HU-03 | Control de acceso por rol | EP-01 | ALTA | 6 | HU-01 | RF-04 | S3 |
| HU-06 | Cambiar contraseña | EP-01 | MEDIA | 3 | HU-01 | RF-07 | S3 |
| HU-32 | Cierre de sesión por inactividad | EP-01 | MEDIA | 2 | HU-01 | RF-37 | S3 |
| HT-04 | Base del frontend con shadcn/ui | EP-07 | ALTA | 10 | HU-01 | RNF-20 | S4 |
| HU-04 | Gestionar usuarios del personal | EP-01 | ALTA | 5 | HU-03 | RF-05 | S4 |
| HU-07 | Registrar cliente | EP-02 | ALTA | 6 | HU-03 | RF-08 | S4 |
| HU-11 | Registrar aseguradora | EP-03 | ALTA | 4 | HU-03 | RF-12 | S4 |
| HU-08 | Editar y desactivar cliente | EP-02 | ALTA | 4 | HU-07 | RF-09 | S5 |
| HU-09 | Buscar clientes | EP-02 | ALTA | 5 | HU-07 | RF-10 | S5 |
| HU-12 | Registrar póliza | EP-03 | ALTA | 8 | HU-07, HU-11 | RF-13 | S5 |
| HU-13 | Editar póliza y su estado | EP-03 | ALTA | 4 | HU-12 | RF-14 | S5 |
| HU-14 | Listar pólizas | EP-03 | ALTA | 3 | HU-12 | RF-15 | S5 |
| HU-16 | Registrar pago | EP-04 | ALTA | 8 | HU-12 | RF-17 | S6 |
| HU-18 | Validar pago | EP-04 | ALTA | 5 | HU-16 | RF-19, RF-24 | S6 |
| HU-19 | Rechazar pago | EP-04 | ALTA | 3 | HU-16 | RF-20, RF-24 | S6 |
| HU-35 | Definir el plan de cuotas de la póliza | EP-03 | ALTA | 6 | HU-12 | RF-40 | S6 |
| HU-37 | Vencimiento automático de cuotas | EP-03 | ALTA | 3 | HU-35 | RF-42 | S6 |
| HU-22 | Emitir recibo digital | EP-05 | ALTA | 6 | HU-18, HT-02 | RF-25 | S7 |
| HU-23 | Anclar recibo en Polygon con reintentos | EP-05 | ALTA | 14 | HU-22 | RF-26, RF-27, RF-28 | S7 |
| HU-42 | Monitorear el saldo de la cuenta operadora | EP-05 | MEDIA | 3 | HU-23 | RF-47 | S7 |
| HU-24 | Ver estado de anclaje del recibo | EP-05 | ALTA | 4 | HU-23 | RF-29 | S8 |
| HU-25 | Recibo imprimible con código QR | EP-05 | ALTA | 6 | HU-22 | RF-30 | S8 |
| HU-28 | Verificar autenticidad del recibo | EP-06 | ALTA | 10 | HU-23 | RF-33, RF-34 | S8 |
| HU-36 | Aplicar pagos a cuotas | EP-03 | ALTA | 5 | HU-35, HU-18 | RF-41 | S8 |
| HU-20 | Listar pagos | EP-04 | ALTA | 6 | HU-16 | RF-21 | S9 |
| HU-26 | Reintentar recibo fallido | EP-05 | MEDIA | 3 | HU-23 | RF-31 | S9 |
| HU-38 | Consultar cuotas por vencer y vencidas | EP-03 | ALTA | 4 | HU-37 | RF-43 | S9 |
| HU-05 | Crear cuenta de cliente | EP-01 | MEDIA | 4 | HU-04, HU-07 | RF-06 | S10 |
| HU-10 | Ver ficha del cliente | EP-02 | MEDIA | 4 | HU-14, HU-20 | RF-11 | S10 |
| HU-15 | Ver saldo pendiente de la póliza | EP-03 | MEDIA | 4 | HU-18 | RF-16 | S10 |
| HU-17 | Reportar pago con comprobante | EP-04 | MEDIA | 10 | HU-16, HU-03 | RF-18 | S10 |
| HU-33 | Aceptar la política de tratamiento de datos | EP-01 | MEDIA | 3 | HU-05 | RF-38 | S10 |
| HT-12 | Servicio de notificaciones por correo | EP-07 | MEDIA | 6 | HT-03 | RNF-25 | S11 |
| HU-27 | Anular recibo | EP-05 | MEDIA | 8 | HU-23 | RF-32 | S11 |
| HU-29 | Consultar mis pólizas y pagos | EP-06 | ALTA | 8 | HU-05, HU-24 | RF-22 | S11 |
| HU-39 | Notificar al cliente la validación o el rechazo del pago | EP-04 | MEDIA | 3 | HT-12, HU-18, HU-19 | RF-44 | S11 |
| HT-05 | Contenerización con Docker | EP-07 | ALTA | 12 | HU-23 | RNF-11, RNF-22 | S12 |
| HU-48 | Pagar cuota en línea | EP-04 | MEDIA | 10 | HU-29, HU-36 | RF-53, RF-54 | S12 |
| HU-49 | Consultar transacciones de pago en línea | EP-04 | MEDIA | 3 | HU-48 | RF-55 | S12 |
| HT-06 | Despliegue en VPS con CI/CD | EP-07 | ALTA | 12 | HT-05 | RNF-10, RNF-16 | S13 |
| HU-34 | Importar clientes y pólizas desde archivo | EP-02 | MEDIA | 8 | HU-12 | RF-39, RNF-28 | S13 |
| HU-31 | Recuperar contraseña por correo | EP-01 | MEDIA | 4 | HT-12 | RF-36, RNF-29 | S13 |
| HT-07 | Instrumentación y monitoreo | EP-08 | ALTA | 6 | HT-06 | RNF-05, RNF-06 | S14 |
| HT-08 | Endurecimiento de seguridad | EP-07 | ALTA | 6 | HT-06 | RNF-09 a RNF-13 | S14 |
| HU-43 | Reporte de conciliación por aseguradora | EP-09 | MEDIA | 6 | HU-20 | RF-48 | S14 |
| HU-44 | Reporte de cartera vencida | EP-09 | MEDIA | 5 | HU-38 | RF-49 | S14 |
| HT-09 | Pruebas de aceptación con Oasis Seguros | EP-08 | ALTA | 12 | HT-06 | RNF-23 | S15 |
| HU-41 | Descargar recibo en PDF | EP-05 | MEDIA | 5 | HU-25 | RF-46 | S15 |
| HU-46 | Administrar catálogos | EP-03 | BAJA | 4 | HU-03 | RF-51 | S15 |
| HU-47 | Actualizar datos de contacto | EP-06 | BAJA | 3 | HU-29 | RF-52 | S15 |
| HT-10 | Evaluación de la eficiencia de desempeño | EP-08 | ALTA | 14 | HT-07 | RNF-01 a RNF-08 | S16 |
| HT-11 | Capacitación y entrega del sistema | EP-08 | ALTA | 10 | HT-09 | — | S18 |
| HU-21 | Exportar pagos a CSV | EP-04 | BAJA | 3 | HU-20 | RF-23 | S18 |
| HU-30 | Panel de indicadores | EP-06 | BAJA | 6 | HU-20, HU-24 | RF-35 | S18 |
| HU-40 | Recordatorio de vencimiento de cuota | EP-03 | BAJA | 3 | HT-12, HU-37 | RF-45 | S18 |

## 5. HISTORIAS DE USUARIO

Historias agrupadas por épica.

### EP-01 Acceso y seguridad

#### HU-01 — Iniciar sesión

- **Descripción:** Como usuario del sistema, quiero iniciar sesión con mi correo y contraseña, para acceder a las funciones que corresponden a mi rol.
- **Estimación:** 8 horas
- **Prioridad:** ALTA
- **Depende de:** HT-03
- **Criterios de aceptación:**
  - Con credenciales válidas se emite un token de acceso y una cookie de renovación httpOnly
  - Con credenciales inválidas se muestra un mensaje genérico que no revela qué dato falló
  - El sexto intento en un minuto desde la misma IP devuelve 429
  - La sesión se renueva automáticamente mientras el token de renovación sea válido
  - Las contraseñas se almacenan con argon2

#### HU-02 — Cerrar sesión

- **Descripción:** Como usuario del sistema, quiero cerrar sesión, para que nadie más utilice mi cuenta desde ese equipo.
- **Estimación:** 3 horas
- **Prioridad:** ALTA
- **Depende de:** HU-01
- **Criterios de aceptación:**
  - El token de renovación queda invalidado en el servidor
  - La cookie de sesión se elimina y se redirige al inicio de sesión
  - Volver atrás en el navegador no muestra datos protegidos

#### HU-03 — Control de acceso por rol

- **Descripción:** Como administrador, quiero que cada usuario acceda solo a las funciones de su rol, para proteger la información del bróker y de sus clientes.
- **Estimación:** 6 horas
- **Prioridad:** ALTA
- **Depende de:** HU-01
- **Criterios de aceptación:**
  - Cada endpoint declara los roles permitidos y un acceso no autorizado devuelve 403
  - El menú muestra solo las opciones del rol del usuario
  - Un usuario CLIENTE solo obtiene sus propias pólizas, pagos y recibos

#### HU-04 — Gestionar usuarios del personal

- **Descripción:** Como administrador, quiero crear, editar y desactivar cuentas del personal, para controlar quién opera el sistema.
- **Estimación:** 5 horas
- **Prioridad:** ALTA
- **Depende de:** HU-03
- **Criterios de aceptación:**
  - Se crea un usuario con correo, nombre, rol ADMIN u OPERADOR y contraseña temporal
  - El correo es único en el sistema
  - Un usuario desactivado no puede iniciar sesión
  - El administrador puede restablecer la contraseña de un usuario

#### HU-05 — Crear cuenta de cliente

- **Descripción:** Como administrador, quiero crear una cuenta de acceso para un cliente registrado, para que consulte sus pagos en línea.
- **Estimación:** 4 horas
- **Prioridad:** MEDIA
- **Depende de:** HU-04, HU-07
- **Criterios de aceptación:**
  - La cuenta se vincula a un único cliente
  - El rol asignado es CLIENTE
  - La contraseña temporal debe cambiarse en el primer ingreso
  - No se permite más de una cuenta por cliente

#### HU-06 — Cambiar contraseña

- **Descripción:** Como usuario, quiero cambiar mi contraseña, para mantener mi cuenta segura.
- **Estimación:** 3 horas
- **Prioridad:** MEDIA
- **Depende de:** HU-01
- **Criterios de aceptación:**
  - Se exige la contraseña actual
  - La nueva contraseña tiene al menos 8 caracteres
  - Al cambiarla se cierran las demás sesiones

#### HU-31 — Recuperar contraseña por correo

- **Descripción:** Como usuario, quiero recuperar mi contraseña mediante un enlace enviado a mi correo, para volver a ingresar sin depender del administrador.
- **Estimación:** 4 horas
- **Prioridad:** MEDIA
- **Depende de:** HT-12
- **Criterios de aceptación:**
  - El usuario solicita la recuperación con su correo; la respuesta no revela si el correo existe
  - El enlace es de un solo uso y vence a los 30 minutos
  - La nueva contraseña cumple la política de contraseñas
  - Al restablecerla se cierran las sesiones activas

#### HU-32 — Cierre de sesión por inactividad

- **Descripción:** Como administrador, quiero que las sesiones se cierren tras un periodo de inactividad, para proteger la información en equipos compartidos.
- **Estimación:** 2 horas
- **Prioridad:** MEDIA
- **Depende de:** HU-01
- **Criterios de aceptación:**
  - La sesión se cierra tras 30 minutos sin actividad
  - Un minuto antes se muestra un aviso con opción de continuar
  - Al cerrarse, se redirige al inicio de sesión

#### HU-33 — Aceptar la política de tratamiento de datos

- **Descripción:** Como cliente, quiero conocer y aceptar la política de tratamiento de mis datos personales, para usar el portal con transparencia.
- **Estimación:** 3 horas
- **Prioridad:** MEDIA
- **Depende de:** HU-05
- **Criterios de aceptación:**
  - En el primer ingreso se muestra la política y se exige su aceptación para continuar
  - Se registran la fecha, la hora y la versión de la política aceptada
  - Si la política cambia, se solicita una nueva aceptación

### EP-02 Gestión de clientes

#### HU-07 — Registrar cliente

- **Descripción:** Como operador, quiero registrar clientes con sus datos de identificación y contacto, para asociarles pólizas y pagos.
- **Estimación:** 6 horas
- **Prioridad:** ALTA
- **Depende de:** HU-03
- **Criterios de aceptación:**
  - El tipo de identificación (cédula, RUC o pasaporte) se valida según RN-11
  - Una identificación duplicada se rechaza con un mensaje claro
  - Los campos obligatorios muestran mensajes de validación
  - Se registra la fecha de creación del cliente

#### HU-08 — Editar y desactivar cliente

- **Descripción:** Como operador, quiero editar o desactivar un cliente, para mantener su información actualizada sin perder su historial.
- **Estimación:** 4 horas
- **Prioridad:** ALTA
- **Depende de:** HU-07
- **Criterios de aceptación:**
  - Se pueden editar los datos de contacto
  - La identificación no se puede modificar si el cliente tiene pólizas
  - Desactivar no elimina el registro (RN-09)
  - Un cliente inactivo no aparece al registrar nuevas pólizas

#### HU-09 — Buscar clientes

- **Descripción:** Como operador, quiero buscar y listar clientes, para encontrar rápidamente a quien necesito atender.
- **Estimación:** 5 horas
- **Prioridad:** ALTA
- **Depende de:** HU-07
- **Criterios de aceptación:**
  - La búsqueda funciona por identificación o por nombre
  - El listado se pagina de 20 en 20
  - Se puede filtrar por clientes activos e inactivos

#### HU-10 — Ver ficha del cliente

- **Descripción:** Como operador, quiero ver la ficha de un cliente con sus pólizas y pagos, para atenderlo con toda su información a la vista.
- **Estimación:** 4 horas
- **Prioridad:** MEDIA
- **Depende de:** HU-14, HU-20
- **Criterios de aceptación:**
  - La ficha muestra datos de contacto, pólizas y pagos con su estado
  - Desde la ficha se accede a los recibos del cliente

#### HU-34 — Importar clientes y pólizas desde archivo

- **Descripción:** Como operador, quiero importar clientes y pólizas desde un archivo Excel o CSV, para cargar la información que hoy está en hojas de cálculo.
- **Estimación:** 8 horas
- **Prioridad:** MEDIA
- **Depende de:** HU-12
- **Criterios de aceptación:**
  - Se acepta una plantilla Excel (.xlsx) o CSV descargable desde el sistema
  - Cada fila se valida con las mismas reglas del registro manual
  - Se muestra una vista previa con las filas válidas y los errores por fila antes de confirmar
  - Solo se importan las filas válidas y se genera un resumen del resultado

### EP-03 Pólizas, cuotas y cartera

#### HU-11 — Registrar aseguradora

- **Descripción:** Como administrador, quiero registrar las aseguradoras con las que trabaja el bróker, para asociarlas a las pólizas.
- **Estimación:** 4 horas
- **Prioridad:** ALTA
- **Depende de:** HU-03
- **Criterios de aceptación:**
  - Se registra nombre y RUC de 13 dígitos
  - Un RUC duplicado se rechaza
  - Las aseguradoras se pueden listar y editar
  - Las aseguradoras son datos de referencia de las pólizas; no tienen cuenta ni acceso al sistema

#### HU-12 — Registrar póliza

- **Descripción:** Como operador, quiero registrar la póliza de un cliente, para controlar las primas que debe pagar.
- **Estimación:** 8 horas
- **Prioridad:** ALTA
- **Depende de:** HU-07, HU-11
- **Criterios de aceptación:**
  - Se registran número único, cliente, aseguradora, ramo, prima total y vigencia
  - La fecha de fin es posterior a la de inicio
  - La prima es mayor que cero y tiene dos decimales (RN-10)
  - La póliza se crea en estado VIGENTE

#### HU-13 — Editar póliza y su estado

- **Descripción:** Como operador, quiero editar una póliza y cambiar su estado, para reflejar renovaciones o cancelaciones.
- **Estimación:** 4 horas
- **Prioridad:** ALTA
- **Depende de:** HU-12
- **Criterios de aceptación:**
  - El estado puede cambiar a VENCIDA o CANCELADA con confirmación
  - Una póliza no vigente no admite nuevos pagos (RN-01)
  - La prima no se puede editar si la póliza tiene pagos validados

#### HU-14 — Listar pólizas

- **Descripción:** Como operador, quiero listar y filtrar las pólizas, para revisar la cartera del bróker.
- **Estimación:** 3 horas
- **Prioridad:** ALTA
- **Depende de:** HU-12
- **Criterios de aceptación:**
  - Se filtra por cliente, aseguradora y estado
  - El listado está paginado
  - Se puede ordenar por fecha de fin de vigencia

#### HU-15 — Ver saldo pendiente de la póliza

- **Descripción:** Como operador, quiero ver el saldo pendiente de cada póliza, para saber cuánto le falta pagar al cliente.
- **Estimación:** 4 horas
- **Prioridad:** MEDIA
- **Depende de:** HU-18
- **Criterios de aceptación:**
  - El saldo es la prima total menos los pagos validados
  - El saldo se muestra en la póliza y en el portal del cliente
  - El saldo se actualiza al validar un pago

#### HU-35 — Definir el plan de cuotas de la póliza

- **Descripción:** Como operador, quiero definir el plan de cuotas de una póliza, para controlar cada vencimiento de pago del cliente.
- **Estimación:** 6 horas
- **Prioridad:** ALTA
- **Depende de:** HU-12
- **Criterios de aceptación:**
  - Se define el número de cuotas y el sistema propone valores y fechas mensuales editables
  - La suma de las cuotas es igual a la prima total (RN-15)
  - Cada cuota tiene número, valor, fecha de vencimiento y estado
  - Una póliza de pago único tiene una sola cuota

#### HU-36 — Aplicar pagos a cuotas

- **Descripción:** Como operador, quiero que cada pago validado se aplique a las cuotas pendientes, para conocer con exactitud qué cuotas están cubiertas.
- **Estimación:** 5 horas
- **Prioridad:** ALTA
- **Depende de:** HU-35, HU-18
- **Criterios de aceptación:**
  - El pago validado se aplica a las cuotas pendientes en orden de vencimiento (RN-13)
  - Una cuota cubierta parcialmente queda en estado PARCIAL
  - Una cuota cubierta en su totalidad queda PAGADA
  - El detalle de la aplicación se muestra en el pago y en la póliza

#### HU-37 — Vencimiento automático de cuotas

- **Descripción:** Como bróker, quiero que las cuotas no pagadas se marquen como vencidas de forma automática, para identificar la morosidad sin revisión manual.
- **Estimación:** 3 horas
- **Prioridad:** ALTA
- **Depende de:** HU-35
- **Criterios de aceptación:**
  - Una tarea diaria a las 00:05 marca como VENCIDA la cuota no pagada cuya fecha de vencimiento ya pasó (RN-14)
  - Una póliza con cuotas vencidas se muestra como en mora (RN-16)
  - La tarea registra su ejecución en los logs

#### HU-38 — Consultar cuotas por vencer y vencidas

- **Descripción:** Como operador, quiero ver las cuotas por vencer y las vencidas, para gestionar la cobranza a tiempo.
- **Estimación:** 4 horas
- **Prioridad:** ALTA
- **Depende de:** HU-37
- **Criterios de aceptación:**
  - El listado muestra cuotas que vencen en los próximos 7 días y cuotas vencidas
  - Se filtra por cliente, aseguradora y rango de fechas
  - Cada fila muestra cliente, póliza, cuota, valor, fecha de vencimiento y días de atraso

#### HU-40 — Recordatorio de vencimiento de cuota

- **Descripción:** Como cliente, quiero recibir un recordatorio antes del vencimiento de mi cuota, para pagar a tiempo.
- **Estimación:** 3 horas
- **Prioridad:** BAJA
- **Depende de:** HT-12, HU-37
- **Criterios de aceptación:**
  - Se envía un correo 5 días antes del vencimiento de cada cuota pendiente
  - El correo indica póliza, número de cuota, valor y fecha de vencimiento
  - No se envía recordatorio de una cuota ya pagada

#### HU-46 — Administrar catálogos

- **Descripción:** Como administrador, quiero administrar los catálogos de ramos de seguro y métodos de pago, para mantener actualizadas las opciones del sistema.
- **Estimación:** 4 horas
- **Prioridad:** BAJA
- **Depende de:** HU-03
- **Criterios de aceptación:**
  - Se crean, editan y desactivan ramos de seguro
  - Se crean, editan y desactivan métodos de pago
  - Un elemento en uso no se elimina, solo se desactiva

### EP-04 Gestión de pagos

#### HU-16 — Registrar pago

- **Descripción:** Como operador, quiero registrar un pago de prima, para dejar constancia de lo que el cliente pagó.
- **Estimación:** 8 horas
- **Prioridad:** ALTA
- **Depende de:** HU-12
- **Criterios de aceptación:**
  - Se registran póliza, monto, fecha, método y referencia
  - Se valida que la póliza esté vigente y que el monto no supere el saldo (RN-01, RN-02)
  - El pago se guarda en estado REGISTRADO
  - Se registra qué usuario creó el pago

#### HU-17 — Reportar pago con comprobante

- **Descripción:** Como cliente, quiero reportar el pago de mi póliza adjuntando el comprobante, para que el bróker lo valide sin que tenga que enviarlo por otros medios.
- **Estimación:** 10 horas
- **Prioridad:** MEDIA
- **Depende de:** HU-16, HU-03
- **Criterios de aceptación:**
  - El cliente solo puede elegir sus propias pólizas vigentes (RN-07)
  - Se aceptan archivos PDF, JPG o PNG de hasta 5 MB
  - El pago queda REGISTRADO hasta que el personal lo valide (RN-08)
  - El personal ve el comprobante al revisar el pago

#### HU-18 — Validar pago

- **Descripción:** Como operador, quiero validar un pago registrado, para confirmarlo frente al extracto bancario del bróker.
- **Estimación:** 5 horas
- **Prioridad:** ALTA
- **Depende de:** HU-16
- **Criterios de aceptación:**
  - Solo se valida un pago en estado REGISTRADO (RN-03)
  - Se registran el usuario y la fecha de validación
  - Un pago validado no se puede editar
  - La acción pide confirmación y toma como máximo tres acciones desde el listado

#### HU-19 — Rechazar pago

- **Descripción:** Como operador, quiero rechazar un pago indicando el motivo, para informar al cliente por qué no se aceptó.
- **Estimación:** 3 horas
- **Prioridad:** ALTA
- **Depende de:** HU-16
- **Criterios de aceptación:**
  - El motivo es obligatorio
  - RECHAZADO es un estado final y no genera recibo
  - Se registran el usuario y la fecha del rechazo
  - El cliente ve el motivo en su portal

#### HU-20 — Listar pagos

- **Descripción:** Como operador, quiero listar y filtrar pagos, para priorizar los que están pendientes de validación.
- **Estimación:** 6 horas
- **Prioridad:** ALTA
- **Depende de:** HU-16
- **Criterios de aceptación:**
  - Se filtra por estado, rango de fechas, póliza y cliente
  - Los pagos por validar aparecen primero
  - El listado está paginado y muestra el total del filtro

#### HU-21 — Exportar pagos a CSV

- **Descripción:** Como operador, quiero exportar el listado de pagos a CSV, para compartirlo con las aseguradoras o analizarlo en una hoja de cálculo.
- **Estimación:** 3 horas
- **Prioridad:** BAJA
- **Depende de:** HU-20
- **Criterios de aceptación:**
  - La exportación respeta los filtros aplicados
  - El archivo usa UTF-8 y se abre correctamente en Excel

#### HU-39 — Notificar al cliente la validación o el rechazo del pago

- **Descripción:** Como cliente, quiero recibir un correo cuando mi pago sea validado o rechazado, para conocer su estado sin ingresar al sistema.
- **Estimación:** 3 horas
- **Prioridad:** MEDIA
- **Depende de:** HT-12, HU-18, HU-19
- **Criterios de aceptación:**
  - Al validar un pago se envía un correo con el enlace de verificación del recibo
  - Al rechazar un pago se envía un correo con el motivo
  - El envío no retrasa la respuesta al operador

#### HU-48 — Pagar cuota en línea

- **Descripción:** Como cliente, quiero pagar mis cuotas en línea con tarjeta desde el portal, para no tener que hacer una transferencia y enviar el comprobante.
- **Estimación:** 10 horas
- **Prioridad:** MEDIA
- **Depende de:** HU-29, HU-36
- **Criterios de aceptación:**
  - El cliente elige una o varias cuotas pendientes o vencidas de sus pólizas vigentes (RN-01, RN-07)
  - El monto no supera el saldo pendiente de la póliza (RN-02)
  - El cobro se realiza en la Cajita de Pagos de PayPhone; el SRPP no recibe datos de la tarjeta (RN-21)
  - El backend confirma la transacción con PayPhone y, si es aprobada, registra el pago VALIDADO, lo aplica a las cuotas y emite el recibo
  - Una transacción cancelada o rechazada no registra pago y el cliente ve el resultado
  - Confirmar dos veces la misma transacción no duplica el pago ni el recibo (RN-20)
  - Las pruebas se realizan en el entorno de pruebas de PayPhone

#### HU-49 — Consultar transacciones de pago en línea

- **Descripción:** Como operador, quiero consultar las transacciones de pago en línea, para conciliar los cobros de la pasarela con los pagos registrados.
- **Estimación:** 3 horas
- **Prioridad:** MEDIA
- **Depende de:** HU-48
- **Criterios de aceptación:**
  - Se listan las transacciones con cliente, póliza, monto, estado y fecha
  - Se filtra por estado y rango de fechas
  - Cada transacción aprobada enlaza a su pago y a su recibo
  - Las transacciones PENDIENTE con más de 10 minutos se consultan de nuevo en la pasarela

### EP-05 Recibos y blockchain

#### HT-02 — Contrato inteligente RegistroRecibos

- **Descripción:** Como desarrollador, quiero el contrato de registro de recibos probado y desplegado en Amoy, para validar desde el inicio la integración con Polygon PoS, que es el mayor riesgo técnico del proyecto.
- **Estimación:** 18 horas
- **Prioridad:** ALTA
- **Depende de:** HT-01
- **Criterios de aceptación:**
  - registrar(id, hash) solo lo ejecuta REGISTRADOR_ROLE, rechaza identificadores repetidos y hash cero, y emite ReciboRegistrado
  - anular, verificar, pause y unpause funcionan según los roles definidos
  - La cobertura de pruebas es ≥ 90 % y se genera el reporte de gas por función
  - Slither no reporta hallazgos de severidad alta
  - El contrato está desplegado y verificado en Amoy, y un script registra un hash de prueba
  - El ABI tipado se exporta a packages/shared

#### HU-22 — Emitir recibo digital

- **Descripción:** Como operador, quiero que al validar un pago se emita automáticamente su recibo digital, para entregar al cliente un comprobante verificable.
- **Estimación:** 6 horas
- **Prioridad:** ALTA
- **Depende de:** HU-18, HT-02
- **Criterios de aceptación:**
  - El pago pasa a VALIDADO y el recibo se crea en PENDIENTE_ANCLAJE dentro de la misma transacción de base de datos
  - El código de verificación es aleatorio y tiene al menos 10 caracteres (RN-12)
  - El hash es keccak256(sal ‖ JSON canónico) con sal aleatoria de 32 bytes
  - Ningún dato personal se envía a la blockchain (RN-06)
  - Cada pago validado tiene exactamente un recibo (RN-04)

#### HU-23 — Anclar recibo en Polygon con reintentos

- **Descripción:** Como bróker, quiero que el hash de cada recibo se registre automáticamente en Polygon sin hacer esperar al personal, para contar con evidencia inmutable de cada pago.
- **Estimación:** 14 horas
- **Prioridad:** ALTA
- **Depende de:** HU-22
- **Criterios de aceptación:**
  - El API responde la validación antes de la confirmación en la cadena
  - El worker procesa la cola con concurrencia 1 y usa jobId = reciboId
  - Ante errores reintenta con espera creciente hasta 5 veces; luego marca FALLIDO
  - Un barrido cada 30 s reencola los recibos pendientes con más de 60 s
  - Si el worker se detiene y reinicia, todos los recibos se anclan una sola vez
  - Se guardan txHash, bloque, gasUsed y las marcas creadoEn, enviadoEn y ancladoEn

#### HU-24 — Ver estado de anclaje del recibo

- **Descripción:** Como operador, quiero ver el estado de anclaje de cada recibo, para saber si ya es verificable en la blockchain.
- **Estimación:** 4 horas
- **Prioridad:** ALTA
- **Depende de:** HU-23
- **Criterios de aceptación:**
  - Cada estado se muestra con una insignia de color y texto
  - El txHash enlaza a amoy.polygonscan.com
  - Se muestran las fechas de envío y de anclaje
  - Mientras está pendiente, el estado se actualiza cada 10 s

#### HU-25 — Recibo imprimible con código QR

- **Descripción:** Como cliente, quiero un recibo imprimible con código QR, para presentarlo o verificarlo cuando lo necesite.
- **Estimación:** 6 horas
- **Prioridad:** ALTA
- **Depende de:** HU-22
- **Criterios de aceptación:**
  - El recibo muestra póliza, monto, fecha, código y estado de anclaje
  - El QR apunta a la ruta /recibos/verificar/:codigo, que exige iniciar sesión
  - El formato se puede imprimir o guardar como PDF desde el navegador
  - No se muestran la sal ni datos internos

#### HU-26 — Reintentar recibo fallido

- **Descripción:** Como administrador, quiero reintentar el anclaje de un recibo fallido, para resolverlo sin intervención técnica.
- **Estimación:** 3 horas
- **Prioridad:** MEDIA
- **Depende de:** HU-23
- **Criterios de aceptación:**
  - Solo el ADMIN puede reintentar y solo recibos en estado FALLIDO
  - El recibo vuelve a PENDIENTE_ANCLAJE y se encola de nuevo
  - Se registra quién ejecutó el reintento

#### HU-27 — Anular recibo

- **Descripción:** Como administrador, quiero anular un recibo con un motivo, para corregir un pago validado por error sin borrar la evidencia.
- **Estimación:** 8 horas
- **Prioridad:** MEDIA
- **Depende de:** HU-23
- **Criterios de aceptación:**
  - Solo el ADMIN puede anular y solo recibos ANCLADOS
  - El motivo es obligatorio y su hash se registra con anular() en el contrato
  - El recibo pasa a ANULADO y no se elimina (RN-05)
  - La verificación del recibo muestra el resultado Anulado

#### HU-41 — Descargar recibo en PDF

- **Descripción:** Como cliente, quiero descargar mi recibo en PDF, para guardarlo o enviarlo a quien lo requiera.
- **Estimación:** 5 horas
- **Prioridad:** MEDIA
- **Depende de:** HU-25
- **Criterios de aceptación:**
  - El PDF contiene los datos del recibo, el código y el QR de verificación
  - El PDF usa la identidad visual de Oasis Seguros
  - El cliente solo descarga sus propios recibos

#### HU-42 — Monitorear el saldo de la cuenta operadora

- **Descripción:** Como administrador, quiero ver el saldo de POL de la cuenta operadora y recibir una alerta cuando sea bajo, para evitar que se detenga el anclaje de recibos.
- **Estimación:** 3 horas
- **Prioridad:** MEDIA
- **Depende de:** HU-23
- **Criterios de aceptación:**
  - El panel del administrador muestra el saldo actual de la cuenta operadora
  - El umbral de alerta es configurable
  - Si el saldo es menor al umbral, se muestra una alerta y se registra en los logs

### EP-06 Portal del cliente y verificación

#### HU-28 — Verificar autenticidad del recibo

- **Descripción:** Como cliente o miembro del personal de Oasis Seguros, quiero verificar un recibo con su código o QR desde mi sesión, para comprobar que el pago es auténtico.
- **Estimación:** 10 horas
- **Prioridad:** ALTA
- **Depende de:** HU-23
- **Criterios de aceptación:**
  - La verificación exige una sesión activa; si se escanea el QR sin sesión, se solicita iniciar sesión y luego se muestra el resultado
  - El sistema recalcula el hash y lo compara con el registrado en el contrato
  - Los resultados posibles son Auténtico, No coincide, En proceso, Anulado y No encontrado
  - Se muestra el enlace a la transacción en el explorador
  - El cliente solo puede verificar sus propios recibos; el recibo de otro cliente se informa como No encontrado (RN-07)
  - Se limitan las consultas a 30 por minuto por usuario

#### HU-29 — Consultar mis pólizas y pagos

- **Descripción:** Como cliente, quiero ver mis pólizas, pagos y recibos, para conocer mi situación sin llamar al bróker.
- **Estimación:** 8 horas
- **Prioridad:** ALTA
- **Depende de:** HU-05, HU-24
- **Criterios de aceptación:**
  - El cliente solo ve sus propios datos
  - Se muestran el estado de cada pago y de cada recibo
  - El cliente accede a sus recibos imprimibles
  - Se muestra el saldo pendiente de cada póliza

#### HU-30 — Panel de indicadores

- **Descripción:** Como administrador, quiero un panel con los indicadores principales, para conocer de un vistazo la situación de los pagos.
- **Estimación:** 6 horas
- **Prioridad:** BAJA
- **Depende de:** HU-20, HU-24
- **Criterios de aceptación:**
  - El panel muestra pagos por validar, pagos validados del mes y recibos anclados y fallidos
  - Cada indicador enlaza al listado filtrado correspondiente

#### HU-47 — Actualizar datos de contacto

- **Descripción:** Como cliente, quiero actualizar mi correo y teléfono de contacto, para recibir las notificaciones en el medio correcto.
- **Estimación:** 3 horas
- **Prioridad:** BAJA
- **Depende de:** HU-29
- **Criterios de aceptación:**
  - El cliente edita su correo y teléfono desde el portal
  - El formato del correo y del teléfono se valida
  - El cambio queda registrado en la bitácora

### EP-07 Plataforma e infraestructura

#### HT-01 — Configuración del monorepo e integración continua

- **Descripción:** Como desarrollador, quiero un monorepo pnpm con herramientas de calidad y un pipeline de integración continua, para que cada cambio se construya y verifique automáticamente desde el primer sprint.
- **Estimación:** 10 horas
- **Prioridad:** ALTA
- **Depende de:** N/A
- **Criterios de aceptación:**
  - El workspace contiene apps/api, apps/web, packages/contracts y packages/shared
  - ESLint, Prettier, husky, lint-staged y commitlint funcionan en cada commit
  - El workflow ci.yml instala dependencias, ejecuta lint y construye en cada push y pull request
  - El README describe cómo levantar el entorno local

#### HT-03 — Base del backend con arquitectura hexagonal

- **Descripción:** Como desarrollador, quiero la base del API con configuración validada, Prisma, logs, salud y manejo de errores, para construir cada módulo sobre la misma estructura hexagonal.
- **Estimación:** 12 horas
- **Prioridad:** ALTA
- **Depende de:** HT-01
- **Criterios de aceptación:**
  - Las variables de entorno se validan con Zod y el API no arranca si falta alguna
  - Prisma 7 funciona con el adaptador pg, la migración inicial y el seed
  - GET /health informa el estado de PostgreSQL y Redis
  - Los logs son JSON e incluyen un requestId por solicitud
  - Un filtro global devuelve los errores en formato uniforme
  - dependency-cruiser falla si el dominio importa infraestructura

#### HT-04 — Base del frontend con shadcn/ui

- **Descripción:** Como desarrollador, quiero la base de la SPA con shadcn/ui, rutas protegidas y un cliente de API, para construir todas las pantallas de forma consistente.
- **Estimación:** 10 horas
- **Prioridad:** ALTA
- **Depende de:** HU-01
- **Criterios de aceptación:**
  - El layout incluye barra lateral, encabezado con usuario y notificaciones con sonner
  - Las rutas se protegen según el rol
  - El cliente de API renueva el token automáticamente ante un 401
  - TanStack Query y React Hook Form con Zod quedan configurados
  - La interfaz se adapta desde 360 px de ancho
  - La pantalla de inicio de sesión funciona de extremo a extremo

#### HT-05 — Contenerización con Docker

- **Descripción:** Como desarrollador, quiero el sistema empaquetado en imágenes Docker con entornos de desarrollo y producción, para desplegarlo de forma reproducible.
- **Estimación:** 12 horas
- **Prioridad:** ALTA
- **Depende de:** HU-23
- **Criterios de aceptación:**
  - Dockerfile multi-stage del API con destinos runtime y migrator; imagen web basada en Caddy
  - compose.dev levanta PostgreSQL, Redis y el nodo de Hardhat
  - compose.prod separa las redes edge e internal, con healthchecks y límites de recursos
  - La clave de firma solo existe en el contenedor worker
  - compose.prod se levanta en local con imágenes construidas localmente

#### HT-06 — Despliegue en VPS con CI/CD

- **Descripción:** Como bróker, quiero el sistema publicado en un servidor con HTTPS, respaldos y despliegue automático, para usarlo en la operación diaria.
- **Estimación:** 12 horas
- **Prioridad:** ALTA
- **Depende de:** HT-05
- **Criterios de aceptación:**
  - El VPS está endurecido: usuario no root, SSH solo con clave, ufw y fail2ban
  - Caddy obtiene y renueva el certificado TLS automáticamente
  - deploy.yml publica las imágenes en GHCR y despliega con prueba de humo
  - El respaldo diario con pg_dump rota 7 días y la restauración está probada
  - La cuenta operadora tiene REGISTRADOR_ROLE en el contrato desplegado en Amoy

#### HT-08 — Endurecimiento de seguridad

- **Descripción:** Como bróker, quiero revisar la seguridad del sistema antes de su evaluación, para proteger la información de los clientes.
- **Estimación:** 6 horas
- **Prioridad:** ALTA
- **Depende de:** HT-06
- **Criterios de aceptación:**
  - Helmet y Caddy aplican cabeceras de seguridad
  - Se verifican los límites de tasa en inicio de sesión y verificación de recibos
  - Ningún secreto está versionado en el repositorio
  - Las validaciones, rechazos y anulaciones registran usuario y fecha

#### HT-12 — Servicio de notificaciones por correo

- **Descripción:** Como bróker, quiero un servicio de envío de correos desde el sistema, para comunicar a clientes y personal los eventos relevantes.
- **Estimación:** 6 horas
- **Prioridad:** MEDIA
- **Depende de:** HT-03
- **Criterios de aceptación:**
  - El puerto NotificacionesPort tiene un adaptador SMTP con Nodemailer
  - Los correos se envían desde la cola notificaciones del worker, con reintentos
  - Las plantillas de correo usan la identidad visual de Oasis Seguros
  - Las credenciales SMTP se configuran por variables de entorno

### EP-08 Evaluación y entrega

#### HT-07 — Instrumentación y monitoreo

- **Descripción:** Como evaluador, quiero métricas de tiempo de respuesta y consumo de recursos, para medir la eficiencia de desempeño del sistema.
- **Estimación:** 6 horas
- **Prioridad:** ALTA
- **Depende de:** HT-06
- **Criterios de aceptación:**
  - El API expone /metrics con histogramas de tiempo por ruta, solo en la red interna
  - compose.monitoring levanta Prometheus, Grafana, cAdvisor y node-exporter
  - Grafana tiene un tablero provisionado y no expone puertos públicos

#### HT-09 — Pruebas de aceptación con Oasis Seguros

- **Descripción:** Como product owner, quiero validar el sistema con el personal de Oasis Seguros, para confirmar que cumple los criterios de aceptación.
- **Estimación:** 12 horas
- **Prioridad:** ALTA
- **Depende de:** HT-06
- **Criterios de aceptación:**
  - Las pruebas E2E de Playwright cubren el flujo principal en Chromium, Firefox y WebKit
  - Se cargan los datos reales iniciales de clientes, aseguradoras y pólizas
  - La sesión de aceptación con el personal queda registrada en un acta
  - Las incidencias encontradas se corrigen o se registran en el backlog

#### HT-10 — Evaluación de la eficiencia de desempeño

- **Descripción:** Como evaluador, quiero ejecutar escenarios de carga y medir los recursos conforme a ISO/IEC 25023, para obtener los resultados del Capítulo IV.
- **Estimación:** 14 horas
- **Prioridad:** ALTA
- **Depende de:** HT-07
- **Criterios de aceptación:**
  - Los escenarios k6 cubren inicio de sesión, listado de pagos, validación de pago y verificación de recibos con 20 y 50 usuarios virtuales
  - Se obtienen PTb-1-G, PTb-3-G, PTb-5-G, PRu-1-G, PRu-2-G y PCa-2-G
  - La latencia de anclaje y el gas medio se calculan a partir de los recibos
  - Los resultados se exportan y se contrastan con los umbrales definidos

#### HT-11 — Capacitación y entrega del sistema

- **Descripción:** Como bróker, quiero que el personal reciba capacitación y la documentación del sistema, para operarlo sin depender del desarrollador.
- **Estimación:** 10 horas
- **Prioridad:** ALTA
- **Depende de:** HT-09
- **Criterios de aceptación:**
  - Existe un manual de usuario por rol: ADMIN, OPERADOR y CLIENTE
  - El manual técnico describe instalación, configuración, respaldo y restauración
  - La sesión de capacitación con el personal queda registrada con lista de asistentes
  - El acta de entrega del sistema queda firmada por Oasis Seguros

### EP-09 Reportes y auditoría

#### HU-43 — Reporte de conciliación por aseguradora

- **Descripción:** Como operador, quiero un reporte de pagos validados por aseguradora y periodo, para conciliar las primas con cada compañía.
- **Estimación:** 6 horas
- **Prioridad:** MEDIA
- **Depende de:** HU-20
- **Criterios de aceptación:**
  - El reporte se filtra por aseguradora y rango de fechas
  - Muestra póliza, cliente, fecha, monto y código de recibo de cada pago, con totales
  - Se exporta a CSV y a PDF

#### HU-44 — Reporte de cartera vencida

- **Descripción:** Como administrador, quiero un reporte de cartera vencida, para conocer la morosidad por cliente y aseguradora.
- **Estimación:** 5 horas
- **Prioridad:** MEDIA
- **Depende de:** HU-38
- **Criterios de aceptación:**
  - El reporte agrupa las cuotas vencidas por cliente y por aseguradora
  - Muestra valor vencido y días de atraso
  - Se exporta a CSV y a PDF

#### HU-45 — Bitácora de auditoría

- **Descripción:** Como administrador, quiero consultar la bitácora de acciones del sistema, para saber quién hizo cada cambio y cuándo.
- **Estimación:** 6 horas
- **Prioridad:** MEDIA
- **Depende de:** HT-03
- **Criterios de aceptación:**
  - Se registran creación, modificación, validación, rechazo, anulación, inicio de sesión e importación
  - Cada registro guarda usuario, fecha, IP, entidad afectada y acción
  - Los registros no se pueden modificar ni eliminar desde la aplicación (RN-17)
  - El ADMIN consulta la bitácora con filtros por usuario, acción y fecha

## 6. SPRINT BACKLOG POR SEMANA

- Cada sprint dura una semana, de lunes a viernes.
- Capacidad: 25 horas por sprint; 15 horas en semanas con feriado (02 y 03 de noviembre, 25 de diciembre y 01 de enero).
- El Sprint 17 queda sin historias nuevas, como reserva para correcciones tras las pruebas de aceptación.

**Tabla 6-1:** Asignación de historias a los sprints semanales

| Sprint | Fechas | Objetivo del sprint | Historias | Horas / capacidad |
| --- | --- | --- | --- | --- |
| S1 | 07/09/2026 11/09/2026 | Monorepo, integración continua y backend base | HT-01, HT-03 | 22 / 25 |
| S2 | 14/09/2026 18/09/2026 | Contrato inteligente RegistroRecibos en Amoy y bitácora de auditoría | HT-02, HU-45 | 24 / 25 |
| S3 | 21/09/2026 25/09/2026 | Inicio de sesión, control de acceso y cierre por inactividad | HU-01, HU-02, HU-03, HU-06, HU-32 | 22 / 25 |
| S4 | 28/09/2026 02/10/2026 | Aplicación web base; usuarios del personal, clientes y catálogo de aseguradoras | HT-04, HU-04, HU-07, HU-11 | 25 / 25 |
| S5 | 05/10/2026 09/10/2026 | Gestión de clientes y registro de pólizas | HU-08, HU-09, HU-12, HU-13, HU-14 | 24 / 25 |
| S6 | 12/10/2026 16/10/2026 | Plan de cuotas; registro, validación y rechazo de pagos | HU-16, HU-18, HU-19, HU-35, HU-37 | 25 / 25 |
| S7 | 19/10/2026 23/10/2026 | Emisión y anclaje de recibos en Polygon | HU-22, HU-23, HU-42 | 23 / 25 |
| S8 | 26/10/2026 30/10/2026 | Recibo verificable y aplicación de pagos a cuotas | HU-24, HU-25, HU-28, HU-36 | 25 / 25 |
| S9 | 02/11/2026 06/11/2026 | Listado de pagos y seguimiento de cuotas (semana con feriados) | HU-20, HU-26, HU-38 | 13 / 15 |
| S10 | 09/11/2026 13/11/2026 | Reporte de pagos por el cliente y cuentas de cliente | HU-05, HU-10, HU-15, HU-17, HU-33 | 25 / 25 |
| S11 | 16/11/2026 20/11/2026 | Portal del cliente, correos y anulación de recibos | HT-12, HU-27, HU-29, HU-39 | 25 / 25 |
| S12 | 23/11/2026 27/11/2026 | Contenerización y pago en línea con PayPhone | HT-05, HU-48, HU-49 | 25 / 25 |
| S13 | 30/11/2026 04/12/2026 | Despliegue en el servidor, importación de datos y recuperación de contraseña | HT-06, HU-34, HU-31 | 24 / 25 |
| S14 | 07/12/2026 11/12/2026 | Monitoreo, seguridad y reportes | HT-07, HT-08, HU-43, HU-44 | 23 / 25 |
| S15 | 14/12/2026 18/12/2026 | Pruebas de aceptación, recibo PDF, catálogos y datos de contacto | HT-09, HU-41, HU-46, HU-47 | 24 / 25 |
| S16 | 21/12/2026 25/12/2026 | Pruebas de rendimiento (semana con feriado) | HT-10 | 14 / 15 |
| S17 | 28/12/2026 01/01/2027 | Reserva y correcciones (semana con feriado) | Reserva | 0 / 15 |
| S18 | 04/01/2027 08/01/2027 | Capacitación, entrega y cierre del proyecto; historias de prioridad BAJA si el tiempo lo permite | HT-11, HU-21, HU-30, HU-40 | 22 / 25 |
