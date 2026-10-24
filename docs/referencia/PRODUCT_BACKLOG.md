# Historias de usuario y Product Backlog — SRPP (Oasis Seguros)

> Fuente de verdad del alcance funcional. Versión 1.5 (23/10/2026), alineada con el documento de historias de usuario y Product Backlog v1.5: sprints de dos semanas (9 sprints, S1 a S9), seguridad del producto (HT-13 a HT-16, HU-52 y HU-53), pagos notificados por las aseguradoras (HU-50), cobertura de la póliza (HU-51) y retiro del pago en línea (HU-48 y HU-49). Los IDs de requisitos (RF-xx, RNF-xx) y reglas de negocio (RN-xx) provienen de la ERS del proyecto; aquí solo se citan por su ID.

Sistema de Registro de Pagos de Primas (SRPP) — Scrum con sprints de dos semanas

**Cliente:** Oasis Seguros

**Elaborado por:** Johann Awki Caizaguano Chicaiza

**Supervisión:** Ing. Diego Alejandro García Saraguro

**Fecha:** 7 de septiembre de 2026

Documento elaborado en el marco del proyecto técnico de titulación de la Carrera de Software, Escuela Superior Politécnica de Chimborazo.

## 1. INTRODUCCIÓN

El Product Backlog del SRPP contiene 67 elementos: 51 historias de usuario y 16 historias técnicas, con un total de 436 horas estimadas, todas planificadas en los 9 sprints.

- **Periodo:** 9 sprints de dos semanas, del 7 de septiembre de 2026 al 8 de enero de 2027.
- **Capacidad:** 50 horas por sprint de S1 a S3 y 56 horas desde S4 (25 y 28 horas por semana), también en las semanas con feriado (486 horas en total).
- **Holgura:** 50 horas libres distribuidas en los sprints; las correcciones posteriores a las pruebas de aceptación (S8) se absorben en S9.

La columna Requisitos del Product Backlog indica los requisitos de la ERS que implementa cada historia.

### 1.1. Roles del equipo Scrum

**Tabla 1-1:** Roles del equipo Scrum

| Rol Scrum | Responsable | Responsabilidades |
| --- | --- | --- |
| Product Owner | Representante de Oasis Seguros (por confirmar) | Prioriza el backlog, acepta o rechaza los incrementos en la revisión de cada sprint |
| Scrum Master | Ing. Diego Alejandro García Saraguro (supervisor del proyecto) | Facilita las ceremonias, elimina impedimentos y vela por el proceso |
| Equipo de desarrollo | Johann Awki Caizaguano Chicaiza | Diseña, construye, prueba y despliega el sistema; mantiene la documentación |

### 1.2. Contexto del negocio

Datos levantados en la reunión con Oasis Seguros del 7 de octubre de 2026 que condicionan el backlog:

- **Personal:** cuatro personas. El gerente usa el rol ADMIN; el coordinador administrativo, la coordinadora comercial y la ejecutiva comercial usan el rol OPERADOR.
- **Ramos:** principales, Vida y Asistencia médica; secundarios, Vehículos, Equipos electrónicos, Aéreo (drones) y Equipos y maquinaria.
- **Compañías:** aseguradoras Aseguradora del Sur, Seguros Unidos, Sweaden e Interoceánica; en asistencia médica, las empresas de medicina prepagada Prestasalud y Ecuasanitas.
- **Cobro de primas:** lo realizan las aseguradoras, principalmente por débito bancario, y notifican al bróker qué clientes están al día. Oasis Seguros no cobra primas, por lo que el SRPP no incluye pago en línea: se retiran HU-48 y HU-49, y los pagos se registran a partir de la notificación de la aseguradora (HU-16 y HU-50).
- **Seguimiento actual:** la cartera y el seguimiento se llevan en archivos de Excel; por eso la importación (HU-34) pasa a prioridad ALTA.
- **Datos de la póliza:** además de la vigencia, el personal consulta la cobertura contratada y las condiciones de la póliza (HU-51).

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
| EP-01 | Acceso y seguridad | Autenticación, roles y cuentas | 10 | 43 |
| EP-02 | Gestión de clientes | Registro y consulta de clientes | 6 | 32 |
| EP-03 | Pólizas, cuotas y cartera | Pólizas, cobertura, plan de cuotas, vencimientos y catálogos | 12 | 50 |
| EP-04 | Gestión de pagos | Registro (individual o desde la notificación de la aseguradora), validación y consulta de pagos de primas | 8 | 48 |
| EP-05 | Recibos y blockchain | Emisión, anclaje, anulación y estado de recibos | 10 | 70 |
| EP-06 | Portal del cliente y verificación | Autoservicio del cliente y verificación de recibos con sesión | 4 | 28 |
| EP-07 | Plataforma e infraestructura | Monorepo, bases técnicas, sistema de diseño, contenedores y despliegue | 10 | 104 |
| EP-08 | Evaluación y entrega | Pruebas de aceptación, rendimiento, capacitación y entrega | 4 | 44 |
| EP-09 | Reportes y auditoría | Reportes de conciliación, cartera vencida y bitácora | 3 | 17 |
|  | Total |  | 67 | 436 |

## 4. PRODUCT BACKLOG

Product Backlog ordenado por sprint.

**Tabla 4-1:** Product Backlog del SRPP

| ID | Historia | Épica | Prioridad | Horas | Depende de | Requisitos | Sprint |
| --- | --- | --- | --- | --- | --- | --- | --- |
| HT-01 | Configuración del monorepo e integración continua | EP-07 | ALTA | 10 | N/A | — | S1 |
| HT-03 | Base del backend con arquitectura hexagonal | EP-07 | ALTA | 12 | HT-01 | RNF-17 | S1 |
| HT-02 | Contrato inteligente RegistroRecibos | EP-05 | ALTA | 18 | HT-01 | RNF-07, RNF-14 | S1 |
| HU-45 | Bitácora de auditoría | EP-09 | MEDIA | 6 | HT-03 | RF-50, RNF-27 | S1 |
| HU-01 | Iniciar sesión | EP-01 | ALTA | 8 | HT-03 | RF-01, RF-03 | S2 |
| HU-02 | Cerrar sesión | EP-01 | ALTA | 3 | HU-01 | RF-02 | S2 |
| HU-03 | Control de acceso por rol | EP-01 | ALTA | 6 | HU-01 | RF-04 | S2 |
| HU-06 | Cambiar contraseña | EP-01 | MEDIA | 3 | HU-01 | RF-07 | S2 |
| HU-32 | Cierre de sesión por inactividad | EP-01 | MEDIA | 2 | HU-01 | RF-37 | S2 |
| HT-04 | Base del frontend con shadcn/ui | EP-07 | ALTA | 10 | HU-01 | RNF-20 | S2 |
| HU-04 | Gestionar usuarios del personal | EP-01 | ALTA | 5 | HU-03 | RF-05 | S2 |
| HU-07 | Registrar cliente | EP-02 | ALTA | 6 | HU-03 | RF-08 | S2 |
| HU-11 | Registrar aseguradora | EP-03 | ALTA | 4 | HU-03 | RF-12 | S2 |
| HU-08 | Editar y desactivar cliente | EP-02 | ALTA | 4 | HU-07 | RF-09 | S3 |
| HU-09 | Buscar clientes | EP-02 | ALTA | 5 | HU-07 | RF-10 | S3 |
| HU-12 | Registrar póliza | EP-03 | ALTA | 8 | HU-07, HU-11 | RF-13 | S3 |
| HU-13 | Editar póliza y su estado | EP-03 | ALTA | 4 | HU-12 | RF-14 | S3 |
| HU-14 | Listar pólizas | EP-03 | ALTA | 3 | HU-12 | RF-15 | S3 |
| HT-13 | Implementación del sistema de diseño de la interfaz | EP-07 | ALTA | 25 | HT-04 | RNF-20, RNF-26 | S3 |
| HU-16 | Registrar pago | EP-04 | ALTA | 8 | HU-12 | RF-17 | S4 |
| HU-18 | Validar pago | EP-04 | ALTA | 5 | HU-16 | RF-19, RF-24 | S4 |
| HU-19 | Rechazar pago | EP-04 | ALTA | 3 | HU-16 | RF-20, RF-24 | S4 |
| HU-35 | Definir el plan de cuotas de la póliza | EP-03 | ALTA | 6 | HU-12 | RF-40 | S4 |
| HU-37 | Vencimiento automático de cuotas | EP-03 | ALTA | 3 | HU-35 | RF-42 | S4 |
| HT-14 | Seguridad de la cadena de suministro | EP-07 | ALTA | 3 | HT-01 | RNF-32, RNF-33, RNF-34 | S4 |
| HU-22 | Emitir recibo digital | EP-05 | ALTA | 6 | HU-18, HT-02 | RF-25 | S4 |
| HU-23 | Anclar recibo en Polygon con reintentos | EP-05 | ALTA | 14 | HU-22 | RF-26, RF-27, RF-28 | S4 |
| HU-42 | Monitorear el saldo de la cuenta operadora | EP-05 | MEDIA | 3 | HU-23 | RF-47 | S4 |
| HT-15 | Seguridad del contrato y de la cuenta operadora | EP-05 | ALTA | 3 | HT-02, HU-23 | RNF-11, RNF-42 | S4 |
| HU-24 | Ver estado de anclaje del recibo | EP-05 | ALTA | 4 | HU-23 | RF-29 | S5 |
| HU-25 | Recibo imprimible con código QR | EP-05 | ALTA | 6 | HU-22 | RF-30 | S5 |
| HU-26 | Reintentar recibo fallido | EP-05 | MEDIA | 3 | HU-23 | RF-31 | S5 |
| HT-16 | Procedimientos de protección de datos y respuesta a incidentes | EP-07 | ALTA | 3 | N/A | RNF-43 | S5 |
| HU-28 | Verificar autenticidad del recibo | EP-06 | ALTA | 10 | HU-23 | RF-33, RF-34 | S5 |
| HU-36 | Aplicar pagos a cuotas | EP-03 | ALTA | 5 | HU-35, HU-18 | RF-41 | S5 |
| HU-20 | Listar pagos | EP-04 | ALTA | 6 | HU-16 | RF-21 | S5 |
| HU-38 | Consultar cuotas por vencer y vencidas | EP-03 | ALTA | 4 | HU-37 | RF-43 | S5 |
| HU-51 | Registrar cobertura y condiciones de la póliza | EP-03 | MEDIA | 2 | HU-12 | RF-57 | S5 |
| HU-05 | Crear cuenta de cliente | EP-01 | MEDIA | 4 | HU-04, HU-07 | RF-06 | S6 |
| HU-10 | Ver ficha del cliente | EP-02 | MEDIA | 4 | HU-14, HU-20 | RF-11 | S6 |
| HU-15 | Ver saldo pendiente de la póliza | EP-03 | MEDIA | 4 | HU-18 | RF-16 | S6 |
| HU-33 | Aceptar la política de tratamiento de datos | EP-01 | MEDIA | 3 | HU-05 | RF-38 | S6 |
| HU-34 | Importar clientes y pólizas desde archivo | EP-02 | ALTA | 9 | HU-12 | RF-39, RNF-28, RNF-37 | S6 |
| HU-53 | Atender solicitudes del titular de datos | EP-02 | ALTA | 4 | HU-10 | RF-59, RNF-43 | S6 |
| HT-12 | Servicio de notificaciones por correo | EP-07 | MEDIA | 6 | HT-03 | RNF-25 | S6 |
| HU-27 | Anular recibo | EP-05 | MEDIA | 8 | HU-23 | RF-32 | S6 |
| HU-29 | Consultar mis pólizas y pagos | EP-06 | ALTA | 9 | HU-05, HU-24 | RF-22, RNF-36 | S6 |
| HU-39 | Notificar al cliente la validación o el rechazo del pago | EP-04 | MEDIA | 3 | HT-12, HU-18, HU-19 | RF-44 | S6 |
| HT-05 | Contenerización con Docker | EP-07 | ALTA | 13 | HU-23 | RNF-11, RNF-22, RNF-32, RNF-40 | S7 |
| HU-50 | Registrar pagos notificados por la aseguradora | EP-04 | ALTA | 8 | HU-16, HU-18, HU-34 | RF-56 | S7 |
| HU-31 | Recuperar contraseña por correo | EP-01 | MEDIA | 4 | HT-12 | RF-36, RNF-29 | S7 |
| HT-06 | Despliegue en VPS con CI/CD | EP-07 | ALTA | 13 | HT-05 | RNF-10, RNF-16, RNF-39 | S7 |
| HU-17 | Reportar pago con comprobante | EP-04 | BAJA | 11 | HU-16, HU-03 | RF-18, RNF-37 | S7 |
| HT-07 | Instrumentación y monitoreo | EP-08 | ALTA | 8 | HT-06 | RNF-05, RNF-06, RNF-38 | S8 |
| HT-08 | Endurecimiento de seguridad | EP-07 | ALTA | 9 | HT-06 | RNF-09 a RNF-13, RNF-35, RNF-36 | S8 |
| HU-43 | Reporte de conciliación por aseguradora | EP-09 | MEDIA | 6 | HU-20 | RF-48 | S8 |
| HU-52 | Proteger las cuentas del personal | EP-01 | MEDIA | 5 | HU-04, HT-12 | RF-58, RNF-41 | S8 |
| HT-09 | Pruebas de aceptación con Oasis Seguros | EP-08 | ALTA | 12 | HT-06 | RNF-23 | S8 |
| HU-21 | Exportar pagos a CSV | EP-04 | BAJA | 4 | HU-20 | RF-23, RNF-37 | S8 |
| HU-30 | Panel de indicadores | EP-06 | BAJA | 6 | HU-20, HU-24 | RF-35 | S8 |
| HT-10 | Evaluación de la eficiencia de desempeño | EP-08 | ALTA | 14 | HT-07 | RNF-01 a RNF-08 | S9 |
| HU-47 | Actualizar datos de contacto | EP-06 | BAJA | 3 | HU-29 | RF-52 | S9 |
| HT-11 | Capacitación y entrega del sistema | EP-08 | ALTA | 10 | HT-09 | — | S9 |
| HU-41 | Descargar recibo en PDF | EP-05 | MEDIA | 5 | HU-25 | RF-46 | S9 |
| HU-46 | Administrar catálogos | EP-03 | BAJA | 4 | HU-03 | RF-51 | S9 |
| HU-40 | Recordatorio de vencimiento de cuota | EP-03 | BAJA | 3 | HT-12, HU-37 | RF-45 | S9 |
| HU-44 | Reporte de cartera vencida | EP-09 | MEDIA | 5 | HU-38 | RF-49 | S9 |

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

#### HU-52 — Proteger las cuentas del personal

- **Descripción:** Como administrador, quiero que las cuentas del personal exijan contraseñas robustas y un segundo factor para el rol ADMIN, para que una contraseña filtrada no baste para entrar al sistema.
- **Estimación:** 5 horas
- **Prioridad:** MEDIA
- **Depende de:** HU-04, HT-12
- **Criterios de aceptación:**
  - Las contraseñas del personal tienen al menos 12 caracteres y una puntuación de 3 o más en zxcvbn-ts, con el diccionario en español
  - El ADMIN activa un segundo factor TOTP (otplib) compatible con las aplicaciones autenticadoras y recibe códigos de recuperación de un solo uso, guardados con argon2
  - El inicio de sesión del ADMIN exige el código TOTP y respeta el límite de intentos
  - El usuario recibe un correo cuando cambian su contraseña, su rol o su segundo factor

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

- **Descripción:** Como operador, quiero importar clientes y pólizas desde un archivo Excel o CSV, para cargar la cartera que hoy se lleva en hojas de cálculo de seguimiento.
- **Estimación:** 9 horas
- **Prioridad:** ALTA
- **Depende de:** HU-12
- **Criterios de aceptación:**
  - Se acepta una plantilla Excel (.xlsx) o CSV descargable desde el sistema
  - Cada fila se valida con las mismas reglas del registro manual
  - Se muestra una vista previa con las filas válidas y los errores por fila antes de confirmar
  - Solo se importan las filas válidas y se genera un resumen del resultado
  - La plantilla de pólizas incluye la cobertura contratada y las condiciones (HU-51)
  - El archivo se limita a 5 MB y 5 000 filas y se procesa con SheetJS 0.20.3 instalado desde su CDN oficial, porque la versión del registro npm tiene vulnerabilidades conocidas

#### HU-53 — Atender solicitudes del titular de datos

- **Descripción:** Como operador, quiero registrar y resolver las solicitudes de acceso, rectificación y eliminación de los clientes, para cumplir la LOPDP dentro del plazo de 10 días.
- **Estimación:** 4 horas
- **Prioridad:** ALTA
- **Depende de:** HU-10
- **Criterios de aceptación:**
  - El operador registra la solicitud con su tipo, fecha y vencimiento a 10 días, y el listado destaca las próximas a vencer
  - El acceso genera un archivo con los datos personales del cliente y sus pólizas, pagos y recibos
  - La eliminación anonimiza los datos personales y borra el contenido y la sal de los recibos sin borrar registros (RN-09), de modo que el hash en la cadena ya no se vincula con el titular
  - Cada solicitud y su resolución quedan en la bitácora

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

#### HU-51 — Registrar cobertura y condiciones de la póliza

- **Descripción:** Como operador, quiero registrar la cobertura contratada y las condiciones de cada póliza, para responder las consultas del cliente sin buscar el documento de la aseguradora.
- **Estimación:** 2 horas
- **Prioridad:** MEDIA
- **Depende de:** HU-12
- **Criterios de aceptación:**
  - La póliza registra la cobertura contratada y sus condiciones como texto de hasta 2 000 caracteres cada una
  - Ambos campos se capturan al registrar y al editar la póliza (HU-12 y HU-13)
  - El detalle de la póliza muestra la cobertura, las condiciones y la vigencia
  - El catálogo inicial de ramos corresponde a los de Oasis Seguros: Vida, Asistencia médica, Vehículos, Equipos electrónicos, Aéreo (drones) y Equipos y maquinaria; los ramos que no comercializa se desactivan

### EP-04 Gestión de pagos

#### HU-16 — Registrar pago

- **Descripción:** Como operador, quiero registrar un pago de prima notificado por la aseguradora, para dejar constancia de lo que el cliente pagó.
- **Estimación:** 8 horas
- **Prioridad:** ALTA
- **Depende de:** HU-12
- **Criterios de aceptación:**
  - Se registran póliza, monto, fecha, método y referencia
  - El catálogo de métodos de pago incluye Débito bancario, el medio habitual con el que las aseguradoras cobran la prima
  - Se valida que la póliza esté vigente y que el monto no supere el saldo (RN-01, RN-02)
  - El pago se guarda en estado REGISTRADO
  - Se registra qué usuario creó el pago

#### HU-17 — Reportar pago con comprobante

- **Descripción:** Como cliente, quiero reportar con su comprobante un pago que hice por un medio distinto del débito bancario, para que el bróker lo valide sin que tenga que enviarlo por otros medios.
- **Estimación:** 11 horas
- **Prioridad:** BAJA
- **Depende de:** HU-16, HU-03
- **Criterios de aceptación:**
  - El cliente solo puede elegir sus propias pólizas vigentes (RN-07)
  - Se aceptan archivos PDF, JPG o PNG de hasta 5 MB
  - El pago queda REGISTRADO hasta que el personal lo valide (RN-08)
  - El personal ve el comprobante al revisar el pago
  - El comprobante se valida por su contenido (FileTypeValidator de NestJS, que lee los números mágicos), se guarda con un nombre aleatorio fuera de la carpeta pública y se entrega como descarga con X-Content-Type-Options: nosniff solo al personal y al cliente dueño
  - Las imágenes se reprocesan con sharp para eliminar los metadatos, incluida la ubicación GPS

#### HU-18 — Validar pago

- **Descripción:** Como operador, quiero validar un pago registrado, para confirmarlo frente a la notificación de cobro de la aseguradora o, si el pago no fue por débito bancario, frente al comprobante.
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
- **Estimación:** 4 horas
- **Prioridad:** BAJA
- **Depende de:** HU-20
- **Criterios de aceptación:**
  - La exportación respeta los filtros aplicados
  - El archivo usa UTF-8 y se abre correctamente en Excel
  - Las celdas que empiezan con =, +, -, @, tabulación o retorno de carro se neutralizan para evitar la inyección de fórmulas en Excel

#### HU-39 — Notificar al cliente la validación o el rechazo del pago

- **Descripción:** Como cliente, quiero recibir un correo cuando mi pago sea validado o rechazado, para conocer su estado sin ingresar al sistema.
- **Estimación:** 3 horas
- **Prioridad:** MEDIA
- **Depende de:** HT-12, HU-18, HU-19
- **Criterios de aceptación:**
  - Al validar un pago se envía un correo con el enlace de verificación del recibo
  - Al rechazar un pago se envía un correo con el motivo
  - El envío no retrasa la respuesta al operador

#### HU-50 — Registrar pagos notificados por la aseguradora

- **Descripción:** Como operador, quiero cargar el archivo con los pagos que notifica cada aseguradora, para registrar de una vez los cobros por débito bancario sin digitarlos uno por uno.
- **Estimación:** 8 horas
- **Prioridad:** ALTA
- **Depende de:** HU-16, HU-18, HU-34
- **Criterios de aceptación:**
  - Se elige la aseguradora y se carga un archivo Excel (.xlsx) o CSV con número de póliza, fecha de cobro, monto y referencia, según una plantilla descargable
  - Cada fila se valida con las reglas del registro manual (RN-01, RN-02) y la póliza debe pertenecer a la aseguradora elegida (RN-23)
  - Una referencia ya registrada para la misma póliza se rechaza y no duplica el pago (RN-22)
  - Se muestra una vista previa con las filas válidas y los errores por fila antes de confirmar
  - Los pagos se registran en estado REGISTRADO con el método Débito bancario y quedan listos para validarse, de uno en uno o todos los de la carga con una sola confirmación
  - Se genera un resumen del resultado y la carga queda en la bitácora de auditoría

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

#### HT-15 — Seguridad del contrato y de la cuenta operadora

- **Descripción:** Como bróker, quiero separar la administración del contrato de la cuenta que firma los recibos y contar con un procedimiento para rotar claves, para que el robo de la clave del servidor no comprometa el registro.
- **Estimación:** 3 horas
- **Prioridad:** ALTA
- **Depende de:** HT-02, HU-23
- **Criterios de aceptación:**
  - DEFAULT_ADMIN_ROLE pertenece a una cuenta distinta de la operadora que no reside en el servidor (billetera fría o Safe multifirma en Amoy)
  - Las pruebas del contrato demuestran que solo REGISTRADOR_ROLE registra y anula, y que solo el administrador pausa, otorga y revoca roles
  - Un procedimiento probado en el nodo local rota la cuenta operadora (grantRole a la nueva, revokeRole a la anterior) y pausa el registro ante una filtración

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
- **Estimación:** 9 horas
- **Prioridad:** ALTA
- **Depende de:** HU-05, HU-24
- **Criterios de aceptación:**
  - El cliente solo ve sus propios datos
  - Se muestran el estado de cada pago y de cada recibo
  - El cliente accede a sus recibos imprimibles
  - Se muestra el saldo pendiente de cada póliza
  - Las pruebas e2e comprueban que un cliente que cambia el identificador en la URL no accede a pólizas, pagos ni recibos de otro cliente (respuesta 404)

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

#### HT-13 — Implementación del sistema de diseño de la interfaz

- **Descripción:** Como desarrollador, quiero implementar en la SPA el sistema de diseño que Oasis Seguros eligió entre las tres propuestas (tokens, tipografía, navegación y componentes base) y aplicarlo a las pantallas existentes, para que las historias siguientes se construyan sobre la interfaz aprobada y no haya que rehacerlas.
- **Estimación:** 25 horas
- **Prioridad:** ALTA
- **Depende de:** HT-04
- **Criterios de aceptación:**
  - Los tokens de color, tipografía, radios, alturas de control y movimiento de la propuesta aprobada reemplazan la paleta provisional, y ningún componente usa colores fuera de ellos
  - Las fuentes se sirven desde el mismo origen, sin CDN de terceros, y el isologo de Oasis Seguros aparece en la navegación y en el inicio de sesión
  - La navegación del personal y el encabezado siguen el diseño aprobado; en el teléfono, el cliente navega con una barra inferior
  - Los estados de pago, recibo, póliza, cliente y verificación se muestran con un único componente que combina icono, texto y color, y que las cuotas reutilizan desde HU-35
  - Las pantallas existentes (inicio de sesión, inicio, pagos, recibos, verificación, clientes, pólizas, aseguradoras, usuarios, bitácora y cambio de contraseña) usan el sistema de diseño sin cambiar su comportamiento
  - Las pantallas cumplen contraste AA y foco visible, los objetivos táctiles del portal miden al menos 44 px y nada desborda a 360 px

#### HT-14 — Seguridad de la cadena de suministro

- **Descripción:** Como desarrollador, quiero que el pipeline detecte dependencias vulnerables, secretos filtrados y código inseguro en cada cambio, para que ningún componente de terceros ni error conocido llegue a producción.
- **Estimación:** 3 horas
- **Prioridad:** ALTA
- **Depende de:** HT-01
- **Criterios de aceptación:**
  - Renovate abre pull requests de actualización agrupados, atiende de inmediato las alertas de vulnerabilidad y fija las acciones de GitHub por su SHA (preset helpers:pinGitHubActionDigestsToSemver)
  - La CI falla si pnpm audit --audit-level=high reporta vulnerabilidades altas o críticas en dependencias de producción
  - Semgrep CE analiza el API y la SPA con las reglas p/typescript, p/nodejs y p/owasp-top-ten, y la CI falla ante hallazgos de severidad alta
  - gitleaks revisa todo el historial en la CI y secretlint bloquea secretos en cada commit mediante lint-staged
  - zizmor analiza los workflows de GitHub Actions sin hallazgos altos y cada job declara permisos mínimos

#### HT-16 — Procedimientos de protección de datos y respuesta a incidentes

- **Descripción:** Como bróker, quiero procedimientos documentados para responder a incidentes y cumplir la LOPDP, para notificar una vulneración a tiempo y demostrar diligencia ante la Superintendencia de Protección de Datos Personales.
- **Estimación:** 3 horas
- **Prioridad:** ALTA
- **Depende de:** N/A
- **Criterios de aceptación:**
  - El plan de respuesta a incidentes define roles, contención, rotación de secretos y la notificación a la Superintendencia por el SISPDP en un máximo de 5 días
  - Una plantilla de comunicación al titular indica la naturaleza de la vulneración, su fecha, las medidas tomadas y recomendaciones
  - Quedan documentados el registro de actividades de tratamiento y los encargados (servidor, correo y proveedor RPC), con el plazo de 2 días para que un encargado avise al responsable
  - La evaluación de impacto del tratamiento cuenta con los insumos técnicos del sistema: datos, flujos y controles

#### HT-05 — Contenerización con Docker

- **Descripción:** Como desarrollador, quiero el sistema empaquetado en imágenes Docker con entornos de desarrollo y producción, para desplegarlo de forma reproducible.
- **Estimación:** 13 horas
- **Prioridad:** ALTA
- **Depende de:** HU-23
- **Criterios de aceptación:**
  - Dockerfile multi-stage del API con destinos runtime y migrator; imagen web basada en Caddy
  - compose.dev levanta PostgreSQL, Redis y el nodo de Hardhat
  - compose.prod separa las redes edge e internal, con healthchecks y límites de recursos
  - La clave de firma solo existe en el contenedor worker
  - compose.prod se levanta en local con imágenes construidas localmente
  - Los contenedores corren sin root, con sistema de archivos de solo lectura, sin capacidades (cap_drop: ALL) y con no-new-privileges
  - La aplicación usa un usuario de PostgreSQL sin permisos de DDL, las migraciones usan otro y Redis exige contraseña
  - Grype analiza las imágenes en la CI y falla ante vulnerabilidades críticas

#### HT-06 — Despliegue en VPS con CI/CD

- **Descripción:** Como bróker, quiero el sistema publicado en un servidor con HTTPS, respaldos y despliegue automático, para usarlo en la operación diaria.
- **Estimación:** 13 horas
- **Prioridad:** ALTA
- **Depende de:** HT-05
- **Criterios de aceptación:**
  - El VPS está endurecido: usuario no root, SSH solo con clave, ufw y fail2ban
  - Caddy obtiene y renueva el certificado TLS automáticamente
  - deploy.yml publica las imágenes en GHCR y despliega con prueba de humo
  - El respaldo diario con pg_dump rota 7 días y la restauración está probada
  - La cuenta operadora tiene REGISTRADOR_ROLE en el contrato desplegado en Amoy
  - Los respaldos se cifran con restic, se copian a un almacenamiento externo compatible con S3 y se conservan 30 días; la restauración del respaldo cifrado se prueba en un entorno limpio

#### HT-08 — Endurecimiento de seguridad

- **Descripción:** Como bróker, quiero revisar la seguridad del sistema antes de su evaluación, para proteger la información de los clientes.
- **Estimación:** 9 horas
- **Prioridad:** ALTA
- **Depende de:** HT-06
- **Criterios de aceptación:**
  - Helmet y Caddy aplican cabeceras de seguridad
  - Se verifican los límites de tasa en inicio de sesión y verificación de recibos
  - Ningún secreto está versionado en el repositorio
  - Las validaciones, rechazos y anulaciones registran usuario y fecha
  - La CSP de Caddy usa frame-ancestors 'none' y se agregan Permissions-Policy y Cross-Origin-Opener-Policy
  - El escaneo base de OWASP ZAP contra el sistema desplegado no reporta alertas de riesgo alto ni medio
  - El límite de solicitudes guarda sus contadores en Redis (@nest-lab/throttler-storage-redis), así que sobrevive a los reinicios
  - La revisión se registra contra la lista de verificación OWASP ASVS 5.0, nivel 2

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
- **Estimación:** 8 horas
- **Prioridad:** ALTA
- **Depende de:** HT-06
- **Criterios de aceptación:**
  - El API expone /metrics con histogramas de tiempo por ruta, solo en la red interna
  - compose.monitoring levanta Prometheus, Grafana, cAdvisor y node-exporter
  - Grafana tiene un tablero provisionado y no expone puertos públicos
  - El API registra los eventos de seguridad (inicios de sesión fallidos, respuestas 401, 403 y 429, cambios de contraseña, rol y segundo factor) con su requestId y sin datos personales ni secretos (redacción de pino)
  - Grafana alerta por correo ante picos de inicios de sesión fallidos o de respuestas 403 y 429

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

## 6. SPRINT BACKLOG POR SPRINT

- Cada sprint dura dos semanas, de lunes a viernes de la semana siguiente.
- **Capacidad:** 50 horas por sprint de S1 a S3 y 56 horas desde S4. Los sprints con feriado (S5 por el 02 y 03 de noviembre, S8 por el 25 de diciembre y S9 por el 01 de enero) conservan la capacidad completa porque el desarrollador también trabaja esos días.
- La segunda semana del Sprint 3 se dedica a implementar el sistema de diseño aprobado (HT-13).
- **No hay un sprint de reserva:** las correcciones posteriores a las pruebas de aceptación (S8) se absorben en la holgura de S9.

**Tabla 6-1:** Asignación de historias a los sprints de dos semanas

| Sprint | Fechas | Objetivo del sprint | Historias | Horas / capacidad |
| --- | --- | --- | --- | --- |
| S1 | 07/09/2026 18/09/2026 | Monorepo, integración continua y backend base; contrato inteligente RegistroRecibos en Amoy y bitácora de auditoría | HT-01, HT-03, HT-02, HU-45 | 46 / 50 |
| S2 | 21/09/2026 02/10/2026 | Inicio de sesión, control de acceso y cierre por inactividad; aplicación web base; usuarios del personal, clientes y catálogo de aseguradoras | HU-01, HU-02, HU-03, HU-06, HU-32, HT-04, HU-04, HU-07, HU-11 | 47 / 50 |
| S3 | 05/10/2026 16/10/2026 | Gestión de clientes y registro de pólizas; implementación del sistema de diseño de la interfaz aprobado por Oasis Seguros | HU-08, HU-09, HU-12, HU-13, HU-14, HT-13 | 49 / 50 |
| S4 | 19/10/2026 30/10/2026 | Plan de cuotas; registro, validación y rechazo de pagos; seguridad de la cadena de suministro; emisión y anclaje de recibos en Polygon; seguridad del contrato y de la cuenta operadora | HU-16, HU-18, HU-19, HU-35, HU-37, HT-14, HU-22, HU-23, HU-42, HT-15 | 54 / 56 |
| S5 | 02/11/2026 13/11/2026 | Estado de anclaje, recibo imprimible, reintento de recibos y procedimientos de protección de datos; verificación de recibos, pagos aplicados a cuotas, listado de pagos, seguimiento de cuotas y cobertura de la póliza (sprint con feriados) | HU-24, HU-25, HU-26, HT-16, HU-28, HU-36, HU-20, HU-38, HU-51 | 43 / 56 |
| S6 | 16/11/2026 27/11/2026 | Cuentas de cliente, importación de la cartera y solicitudes del titular de datos; portal del cliente, correos y anulación de recibos | HU-05, HU-10, HU-15, HU-33, HU-34, HU-53, HT-12, HU-27, HU-29, HU-39 | 54 / 56 |
| S7 | 30/11/2026 11/12/2026 | Contenerización, pagos notificados por las aseguradoras y recuperación de contraseña; despliegue en el servidor y reporte de pagos con comprobante | HT-05, HU-50, HU-31, HT-06, HU-17 | 49 / 56 |
| S8 | 14/12/2026 25/12/2026 | Monitoreo, seguridad, reportes de conciliación y protección de las cuentas del personal; pruebas de aceptación, exportación de pagos a CSV y panel de indicadores (sprint con feriado) | HT-07, HT-08, HU-43, HU-52, HT-09, HU-21, HU-30 | 50 / 56 |
| S9 | 28/12/2026 08/01/2027 | Pruebas de rendimiento y actualización de datos de contacto; capacitación, entrega y cierre del proyecto; recibo PDF, catálogos, recordatorio de cuotas y cartera vencida (sprint con feriado) | HT-10, HU-47, HT-11, HU-41, HU-46, HU-40, HU-44 | 44 / 56 |
