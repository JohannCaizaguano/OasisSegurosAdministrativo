> Documento de arquitectura del SRPP (arc42 + C4). Versión 1.2 (29/09/2026). Los diagramas originales están en `arquitectura_img/`; los aspectos esenciales del modelo de datos se transcriben en texto en la sección 9.

**DOCUMENTO DE ARQUITECTURA DE SOFTWARE**

Sistema de Registro de Pagos de Primas (SRPP)

**Cliente:** Oasis Seguros

**Elaborado por:** Johann Awki Caizaguano Chicaiza

**Supervisión:** Ing. Diego Alejandro García Saraguro

**Fecha:** 7 de septiembre de 2026

*Documento elaborado en el marco del proyecto técnico de titulación de la Carrera de Software, Escuela Superior Politécnica de Chimborazo.*

**Control de versiones**

| **Versión** | **Fecha**  | **Descripción**                                                                                       | **Autor**     |
|-------------|------------|-------------------------------------------------------------------------------------------------------|---------------|
| 1.0         | 07/09/2026 | Versión inicial                                                                                       | J. Caizaguano |
| 1.1         | 28/09/2026 | Módulos de cuotas, notificaciones, reportes y auditoría; servicio de correo; modelo de datos ampliado | J. Caizaguano |
| 1.2         | 29/09/2026 | Actualización de fechas del proyecto (cierre el 08/01/2027)                                           | J. Caizaguano |

# 1. INTRODUCCIÓN
## 1.1. Propósito
Describir la arquitectura del Sistema de Registro de Pagos de Primas (SRPP): sus componentes, patrones, flujos de ejecución, despliegue, modelo de datos y decisiones técnicas.

## 1.2. Alcance
El documento cubre la aplicación web, el backend, el proceso de anclaje, la base de datos, el contrato inteligente RegistroRecibos y la infraestructura de despliegue.

## 1.3. Convenciones
- Estructura del documento: plantilla arc42.

- Diagramas de arquitectura: modelo C4 (niveles de contexto, contenedores y componentes).

- Diagramas de comportamiento: secuencia y estados.

## 1.4. Documentos relacionados
- Especificación de Requisitos de Software (ERS) del SRPP.

- Historias de usuario y Product Backlog del SRPP.

- Planificación del proyecto SRPP.

# 2. VISIÓN GENERAL DEL SISTEMA
El SRPP es una aplicación web para el registro de pagos de primas de Oasis Seguros. Gestiona clientes, pólizas, planes de cuotas y pagos; cada pago validado genera un recibo digital cuyo hash se registra en un contrato inteligente en Polygon PoS, y cualquier persona puede verificar el recibo con su código o QR.

## 2.1. Principios de la arquitectura
- **Registro operativo en PostgreSQL:** clientes, pólizas, pagos y recibos se almacenan en la base de datos relacional.

- **Evidencia en la blockchain:** en el contrato se registran únicamente un identificador opaco y el hash con sal de cada recibo.

- **Anclaje asíncrono:** la validación de un pago responde al usuario tras confirmarse en la base de datos; el registro en la cadena lo realiza un proceso independiente.

- **Arquitectura hexagonal:** cada módulo del backend separa dominio, aplicación, infraestructura y presentación.

- **Aislamiento de la clave de firma:** solo el proceso worker dispone de la clave privada de la cuenta operadora.

- **Despliegue en un servidor:** todos los componentes se ejecutan con Docker Compose en un VPS.

## 2.2. Atributos de calidad prioritarios
**Tabla 2-1:** Atributos de calidad

| **Prioridad** | **Atributo**            | **Requisitos**         |
|---------------|-------------------------|------------------------|
| 1             | Eficiencia de desempeño | RNF-01 a RNF-08        |
| 2             | Fiabilidad del anclaje  | RNF-15                 |
| 3             | Seguridad y privacidad  | RNF-09 a RNF-14, RN-06 |
| 4             | Mantenibilidad          | RNF-17 a RNF-19        |
| 5             | Bajo costo de operación | RNF-22                 |

## 2.3. Usuarios del sistema
**Tabla 2-2:** Usuarios y uso del sistema

| **Usuario**                    | **Uso**                                                    |
|--------------------------------|------------------------------------------------------------|
| Administrador de Oasis Seguros | Administra usuarios, recibos y la configuración operativa  |
| Personal administrativo        | Gestiona clientes, pólizas y valida pagos                  |
| Cliente asegurado              | Consulta pólizas y pagos, reporta pagos y descarga recibos |
| Aseguradora o tercero          | Verifica recibos desde la página pública                   |

# 3. RESTRICCIONES
**Tabla 3-1:** Restricciones técnicas y operativas

| **Tipo**        | **Restricción**                                                       |
|-----------------|-----------------------------------------------------------------------|
| Tecnología      | NestJS, PostgreSQL con Prisma, React con Vite, Solidity con Hardhat 3 |
| Red blockchain  | Polygon PoS; red de pruebas Amoy (chain ID 80002)                     |
| Usuarios        | Sin wallets; acceso con usuario y contraseña                          |
| Infraestructura | Un VPS de 4 vCPU y 8 GB (OVHcloud VPS-1) con Docker Compose           |
| Legal           | LOPDP del Ecuador: sin datos personales en la blockchain              |
| Metodología     | Scrum con sprints semanales                                           |

# 4. CONTEXTO DEL SISTEMA
<img src="media/img2.png" style="width:5.6in;height:4.54396in" />

**Ilustración 4-1:** Diagrama de contexto del SRPP (C4, nivel 1)  
*(Diagrama: `arquitectura_img/ilustracion-4-1.png`)*

**Tabla 4-1:** Sistemas externos

| **Sistema**               | **Canal**            | **Función**                                                |
|---------------------------|----------------------|------------------------------------------------------------|
| Navegador de los usuarios | HTTPS, JSON          | Acceso a la aplicación web y a la verificación pública     |
| Alchemy                   | JSON-RPC sobre HTTPS | Proveedor de nodo para Polygon PoS                         |
| Contrato RegistroRecibos  | ABI del contrato     | Registro, anulación y consulta de recibos                  |
| Servicio de correo        | SMTP con TLS         | Notificaciones, recordatorios y recuperación de contraseña |
| PolygonScan               | Enlace web           | Consulta pública de las transacciones de anclaje           |

# 5. PATRONES DE ARQUITECTURA Y DISEÑO
**Tabla 5-1:** Patrones aplicados

| **Nivel**   | **Patrón**                                     | **Aplicación en el SRPP**                                                                     |
|-------------|------------------------------------------------|-----------------------------------------------------------------------------------------------|
| Sistema     | Cliente-servidor en tres capas                 | SPA React, API NestJS y PostgreSQL                                                            |
| Sistema     | Monolito modular                               | Un backend desplegable, dividido en los módulos Auth, Clientes, Pólizas, Pagos y Recibos      |
| Sistema     | Proxy inverso                                  | Caddy sirve la SPA, enruta /api al backend y gestiona TLS                                     |
| Backend     | Hexagonal (puertos y adaptadores)              | Estructura interna de cada módulo del API                                                     |
| Backend     | Inyección de dependencias                      | Los puertos se enlazan con sus adaptadores mediante tokens en el contenedor de NestJS         |
| Backend     | Repositorio y Mapper                           | Persistencia con Prisma; los mappers convierten filas en entidades de dominio                 |
| Backend     | Caso de uso                                    | Una clase por operación de negocio en application/use-cases                                   |
| Integración | Outbox transaccional                           | El recibo PENDIENTE_ANCLAJE se crea en la misma transacción que valida el pago                |
| Integración | Cola de trabajos y worker                      | BullMQ sobre Redis; colas anclaje-recibos y notificaciones en un proceso worker independiente |
| Integración | Tareas programadas                             | @nestjs/schedule en el worker: barrido de recibos, vencimiento de cuotas y recordatorios      |
| Integración | Consumidor idempotente                         | jobId igual al identificador del recibo y verificación previa en el contrato                  |
| Integración | Reintento con espera exponencial               | Hasta 5 intentos; luego el recibo pasa a FALLIDO                                              |
| Blockchain  | Oráculo de salida (push)                       | El backend envía el hash del recibo al contrato cuando se valida un pago                      |
| Blockchain  | Datos fuera de la cadena con hash en la cadena | Contenido y sal en PostgreSQL; identificador y hash en el contrato                            |
| Contrato    | Control de acceso por roles                    | AccessControl de OpenZeppelin: DEFAULT_ADMIN_ROLE y REGISTRADOR_ROLE                          |
| Contrato    | Parada de emergencia                           | Pausable de OpenZeppelin                                                                      |
| Frontend    | Organización por funcionalidad                 | Carpetas src/features por módulo                                                              |
| Frontend    | Caché de estado del servidor                   | TanStack Query                                                                                |

## 5.1. Arquitectura hexagonal del backend
<img src="media/img3.png" style="width:6.3in;height:4.14464in" />

**Ilustración 5-1:** Arquitectura hexagonal del backend  
*(Diagrama: `arquitectura_img/ilustracion-5-1.png`)*

- **Dominio:** entidades, objetos de valor, reglas de negocio y errores de dominio. No depende de NestJS, Prisma, viem ni BullMQ.

- **Aplicación:** casos de uso y puertos (interfaces) que el dominio requiere del exterior.

- **Adaptadores primarios:** controladores REST, controlador público de verificación, procesador de la cola y tarea programada de barrido.

- **Adaptadores secundarios:** repositorios Prisma (PostgreSQL), adaptador viem (Polygon), adaptador BullMQ (Redis) y almacenamiento de comprobantes.

- **Regla de dependencias:** las dependencias apuntan hacia el dominio; dependency-cruiser la verifica en la integración continua.

## 5.2. Anclaje con outbox transaccional
> 1\. Al validar un pago, una única transacción de base de datos marca el pago como VALIDADO y crea el recibo en estado PENDIENTE_ANCLAJE.
>
> 2\. Tras la confirmación de la transacción, el API encola el trabajo en BullMQ con jobId igual al identificador del recibo.
>
> 3\. Cada 30 segundos, una tarea de barrido reencola los recibos en PENDIENTE_ANCLAJE con más de 60 segundos de antigüedad.
>
> 4\. El worker procesa la cola con concurrencia 1. Antes de enviar, consulta el estado del recibo, el receipt de un txHash previo y la función verificar del contrato.
>
> 5\. Si el recibo ya existe en el contrato, se marca ANCLADO sin reenviar la transacción.
>
> 6\. El contrato rechaza identificadores repetidos.

## 5.3. Integración con la blockchain
- El módulo Blockchain actúa como oráculo de salida: envía al contrato el hash de cada recibo cuando ocurre la validación del pago.

- El contenido completo del recibo y su sal se almacenan en PostgreSQL; el contrato almacena el identificador opaco, el hash, la fecha de registro y el indicador de anulación.

- La lectura del contrato (verificar) no consume gas.

## 5.4. Contrato inteligente
- **Roles:** DEFAULT_ADMIN_ROLE administra roles y pausa; su cuenta se custodia fuera del servidor. REGISTRADOR_ROLE registra y anula recibos; lo utiliza el worker.

- **Parada de emergencia:** pause() detiene nuevos registros sin afectar los existentes.

- **Inmutabilidad:** el contrato no utiliza proxy actualizable. Una nueva versión se despliega como un contrato nuevo.

# 6. VISTA DE CONTENEDORES Y COMPONENTES
<img src="media/img4.png" style="width:6.4in;height:3.27893in" />

**Ilustración 6-1:** Diagrama de contenedores del SRPP (C4, nivel 2)  
*(Diagrama: `arquitectura_img/ilustracion-6-1.png`)*

**Tabla 6-1:** Contenedores

| **Contenedor** | **Tecnología**                                   | **Responsabilidad**                                                         |
|----------------|--------------------------------------------------|-----------------------------------------------------------------------------|
| web            | Caddy 2 + build estático de React                | Sirve la SPA, enruta /api al backend, gestiona TLS y cabeceras de seguridad |
| api            | NestJS 12 sobre Node.js 24                       | Casos de uso, autenticación y reglas de negocio; lectura del contrato       |
| worker         | Misma imagen que api, punto de entrada worker.ts | Anclaje de recibos, envío de correos y tareas programadas                   |
| postgres       | PostgreSQL 17                                    | Clientes, pólizas, cuotas, pagos, recibos y bitácora                        |
| redis          | Redis 7 con AOF                                  | Persistencia de los trabajos de BullMQ                                      |
| migrate        | Prisma CLI                                       | Aplica las migraciones antes del arranque de api y worker                   |

## 6.1. Módulos del backend
**Tabla 6-2:** Módulos del backend

| **Módulo**     | **Responsabilidad**                                                                                 | **Librerías de soporte**           |
|----------------|-----------------------------------------------------------------------------------------------------|------------------------------------|
| auth           | Inicio y cierre de sesión, renovación de tokens, recuperación de contraseña, cierre por inactividad | @nestjs/jwt, passport, argon2      |
| usuarios       | Cuentas del personal y de clientes, aceptación de la política de datos                              | Prisma                             |
| clientes       | Registro, consulta e importación de clientes                                                        | Prisma, exceljs                    |
| polizas        | Aseguradoras, pólizas, plan de cuotas, vencimientos y catálogos                                     | Prisma, @nestjs/schedule           |
| pagos          | Registro, validación, rechazo y aplicación de pagos a cuotas; comprobantes                          | Prisma                             |
| recibos        | Emisión, anclaje, verificación, anulación y PDF de recibos; saldo de la cuenta operadora            | viem, BullMQ, canonicalize, pdfkit |
| notificaciones | Plantillas y envío de correos                                                                       | Nodemailer, BullMQ                 |
| reportes       | Conciliación por aseguradora y cartera vencida; exportación CSV y PDF                               | pdfkit                             |
| auditoria      | Registro y consulta de la bitácora de acciones                                                      | Prisma (solo inserción)            |

## 6.2. Componentes del módulo Blockchain
<img src="media/img5.png" style="width:6.5in;height:2.22753in" />

**Ilustración 6-2:** Componentes del módulo Blockchain (C4, nivel 3)  
*(Diagrama: `arquitectura_img/ilustracion-6-2.png`)*

**Tabla 6-3:** Componentes del módulo Blockchain

| **Componente**                                   | **Capa**                | **Responsabilidad**                                                |
|--------------------------------------------------|-------------------------|--------------------------------------------------------------------|
| RecibosController                                | Presentación            | Consulta de recibos, reintento y anulación (usuarios autenticados) |
| VerificacionPublicaController                    | Presentación            | Verificación pública por código                                    |
| AnclajeProcessor                                 | Infraestructura (cola)  | Consume la cola anclaje-recibos y ejecuta AnclarRecibo             |
| BarridoPendientesTask                            | Infraestructura (tarea) | Reencola recibos pendientes cada 30 segundos                       |
| EmitirRecibo / AnclarRecibo / VerificarRecibo    | Aplicación              | Casos de uso del ciclo del recibo                                  |
| Recibo, EstadoRecibo, HashRecibo                 | Dominio                 | Entidad, máquina de estados y objeto de valor del hash             |
| RegistroRecibosPort → ViemRegistroRecibosAdapter | Puerto → adaptador      | Operaciones sobre el contrato mediante viem                        |
| RecibosRepositoryPort → PrismaRecibosRepository  | Puerto → adaptador      | Persistencia de recibos                                            |
| ColaAnclajePort → BullMqColaAnclajeAdapter       | Puerto → adaptador      | Encolado de trabajos de anclaje                                    |

## 6.3. Estructura del repositorio
```text
oasis-seguros/
├── apps/
│   ├── api/src/
│   │   ├── main.ts            # entrada HTTP
│   │   ├── worker.ts          # entrada del worker
│   │   ├── config/  shared-kernel/  common/  infrastructure/
│   │   └── modules/
│   │       ├── auth/  usuarios/  clientes/  polizas/  pagos/
│   │       ├── notificaciones/  reportes/  auditoria/
│   │       └── recibos/
│   │           ├── domain/
│   │           ├── application/ (ports/ use-cases/)
│   │           ├── infrastructure/ (blockchain/ persistence/ queue/)
│   │           └── presentation/http/
│   └── web/src/
│       ├── app/  components/ui/  lib/
│       └── features/ (auth/ clientes/ polizas/ pagos/ recibos/ verificacion/)
├── packages/
│   ├── contracts/  (RegistroRecibos.sol, pruebas, Ignition)
│   └── shared/     (esquemas Zod, ABI tipado)
├── infra/ (monitoring/ k6/ scripts/)
├── docs/ (arquitectura/ adr/ despliegue.md)
└── compose.dev.yaml  compose.prod.yaml  compose.monitoring.yaml
```

# 7. VISTA DE EJECUCIÓN
## 7.1. Validación de pago y anclaje del recibo
<img src="media/img6.png" style="width:6.5in;height:4.191in" />

**Ilustración 7-1:** Secuencia de validación de pago y anclaje del recibo  
*(Diagrama: `arquitectura_img/ilustracion-7-1.png`)*

- Pasos 1 a 4: solicitud del operador; finaliza al confirmarse la transacción de base de datos.

- Pasos 5 a 13: anclaje en el worker; cada cambio de estado registra su marca de tiempo (creadoEn, enviadoEn, ancladoEn).

## 7.2. Verificación pública
<img src="media/img7.png" style="width:6.3in;height:3.27268in" />

**Ilustración 7-2:** Secuencia de verificación pública de un recibo  
*(Diagrama: `arquitectura_img/ilustracion-7-2.png`)*

**Tabla 7-1:** Resultados de la verificación

| **Resultado** | **Condición**                                                 |
|---------------|---------------------------------------------------------------|
| Auténtico     | El hash recalculado coincide con el registrado en el contrato |
| No coincide   | El hash recalculado difiere del registrado                    |
| En proceso    | El recibo aún no está anclado                                 |
| Anulado       | El recibo fue anulado en el contrato                          |
| No encontrado | El código no existe                                           |

## 7.3. Estados del recibo
<img src="media/img8.png" style="width:6.5in;height:1.41401in" />

**Ilustración 7-3:** Diagrama de estados del recibo digital  
*(Diagrama: `arquitectura_img/ilustracion-7-3.png`)*

**Tabla 7-2:** Estados del recibo

| **Estado**        | **Descripción**                                          |
|-------------------|----------------------------------------------------------|
| PENDIENTE_ANCLAJE | Recibo creado al validar el pago; en espera de anclaje   |
| ENVIADO           | Transacción enviada; txHash registrado                   |
| ANCLADO           | Transacción confirmada; bloque y gas registrados         |
| FALLIDO           | Se agotaron los 5 intentos; el ADMIN puede reintentar    |
| ANULADO           | Anulado por el ADMIN; la anulación consta en el contrato |

## 7.4. Estados de la cuota
**Tabla 7-3:** Estados de la cuota

| **Estado** | **Descripción**                                                                                           |
|------------|-----------------------------------------------------------------------------------------------------------|
| PENDIENTE  | Cuota sin pagos aplicados y con fecha de vencimiento futura                                               |
| PARCIAL    | Cuota con pagos aplicados que no cubren su valor                                                          |
| PAGADA     | Cuota cubierta en su totalidad                                                                            |
| VENCIDA    | Cuota no pagada en su totalidad después de su fecha de vencimiento; la marca la tarea diaria de las 00:05 |

## 7.5. Tareas programadas
**Tabla 7-4:** Tareas programadas del worker

| **Tarea**                     | **Frecuencia**   | **Acción**                                                               |
|-------------------------------|------------------|--------------------------------------------------------------------------|
| Barrido de recibos pendientes | Cada 30 segundos | Reencola recibos en PENDIENTE_ANCLAJE con más de 60 segundos             |
| Vencimiento de cuotas         | Diaria, 00:05    | Marca como VENCIDA las cuotas no pagadas con fecha de vencimiento pasada |
| Recordatorios de vencimiento  | Diaria, 08:00    | Encola un correo por cada cuota que vence en 5 días                      |
| Saldo de la cuenta operadora  | Cada hora        | Consulta el saldo de POL y registra una alerta si es menor al umbral     |

# 8. VISTA DE DESPLIEGUE
<img src="media/img9.png" style="width:6.4in;height:4.26667in" />

**Ilustración 8-1:** Diagrama de despliegue del SRPP  
*(Diagrama: `arquitectura_img/ilustracion-8-1.png`)*

- Solo el contenedor web publica puertos (80 y 443).

- PostgreSQL, Redis, API y worker se ejecutan en una red interna sin exposición pública.

- El perfil de monitoreo (Prometheus, Grafana, cAdvisor, node-exporter) se activa durante las pruebas de rendimiento; Grafana se accede por túnel SSH.

**Tabla 8-1:** Entornos

| **Entorno** | **Ubicación**                                                                       | **Red blockchain**                     | **Uso**                                |
|-------------|-------------------------------------------------------------------------------------|----------------------------------------|----------------------------------------|
| Desarrollo  | Equipo local: PostgreSQL, Redis y nodo Hardhat en Docker; aplicaciones con pnpm dev | Nodo local de Hardhat (chain ID 31337) | Desarrollo y pruebas de integración    |
| Pruebas     | OVHcloud VPS-1 con compose.prod y compose.monitoring                                | Amoy (chain ID 80002)                  | Pruebas de aceptación y de rendimiento |
| Producción  | OVHcloud VPS-1 con compose.prod                                                     | Amoy; Polygon PoS por configuración    | Operación de Oasis Seguros             |

## 8.1. Integración y despliegue continuos
<img src="media/img10.png" style="width:6.5in;height:1.53345in" />

**Ilustración 8-2:** Flujo de integración y despliegue continuos  
*(Diagrama: `arquitectura_img/ilustracion-8-2.png`)*

- **ci.yml** (cada push y pull request): instalación, lint, verificación de tipos, dependency-cruiser, pruebas del API y del frontend, pruebas del contrato, solhint, Slither y construcción de imágenes.

- **deploy.yml** (etiquetas v\*): publicación de imágenes en GHCR y despliegue por SSH con migraciones y prueba de humo.

# 9. MODELO DE DATOS
<img src="media/img11.png" style="width:6.5in;height:4.25323in" />

**Ilustración 9-1:** Modelo de datos del SRPP  
*(Diagrama: `arquitectura_img/ilustracion-9-1.png`)*

- Identificadores UUID.

- Montos en Decimal(12,2).

- Los registros con historial se desactivan o cambian de estado; no se eliminan.

- AplicacionPago registra qué parte de cada pago cubre cada cuota.

- BitacoraAuditoria admite solo inserciones.

### 9.0. Transcripción textual del modelo de datos (Ilustración 9-1)

Todas las entidades usan `id: uuid` como clave primaria. Montos en `Decimal(12,2)`.

| Entidad | Campos | Relaciones |
| --- | --- | --- |
| Usuario | email (único), passwordHash, rol (ADMIN \| OPERADOR \| CLIENTE), activo, clienteId? (único, FK), politicaAceptadaEn, politicaVersion | 0..1 ↔ 1 Cliente; 1:N TokenRecuperacion; 1:N BitacoraAuditoria |
| TokenRecuperacion | usuarioId (FK), tokenHash, expiraEn, usadoEn | N:1 Usuario |
| BitacoraAuditoria | usuarioId (FK), accion, entidad, entidadId, ip, detalle (json), creadoEn | N:1 Usuario; solo inserción |
| Cliente | tipoIdentificacion (enum: cédula, RUC, pasaporte), identificacion (único), nombres / apellidos / razonSocial, email, telefono, activo | 1:N Poliza; 1:0..1 Usuario |
| Aseguradora | nombre, ruc (único, 13 dígitos) | 1:N Poliza |
| Ramo | nombre, activo | 1:N Poliza |
| Poliza | numero (único), clienteId, aseguradoraId, ramoId (FK), primaTotal, fechaInicio, fechaFin, estado (VIGENTE \| VENCIDA \| CANCELADA) | 1:N Cuota; 1:N Pago |
| Cuota | polizaId (FK), numero (int), valor, valorPagado, fechaVencimiento, estado (PENDIENTE \| PARCIAL \| PAGADA \| VENCIDA) | N:1 Poliza; 1:N AplicacionPago |
| MetodoPago | nombre, activo | 1:N Pago |
| Pago | polizaId (FK), monto, fechaPago, metodoPagoId (FK), referencia, comprobanteRuta?, estado (REGISTRADO \| VALIDADO \| RECHAZADO), registradoPorId, validadoPorId (FK), validadoEn, motivoRechazo | N:1 Poliza; 1:N AplicacionPago; 1:0..1 Recibo |
| AplicacionPago | pagoId (FK), cuotaId (FK), monto | N:1 Pago; N:1 Cuota |
| Recibo | codigo (único, público), pagoId (FK, único), idOnchain, hashRecibo, sal (hex), payloadCanonico (text), estado (PENDIENTE_ANCLAJE \| ENVIADO \| ANCLADO \| FALLIDO \| ANULADO), txHash, blockNumber, gasUsed, creadoEn, enviadoEn, ancladoEn | 1:0..1 con Pago |

## 9.1. Interfaz del contrato RegistroRecibos
**Tabla 9-1:** Interfaz del contrato RegistroRecibos

| **Elemento** | **Firma**                                | **Acceso**                            | **Descripción**                                                |
|--------------|------------------------------------------|---------------------------------------|----------------------------------------------------------------|
| Función      | registrar(bytes32 id, bytes32 hash)      | REGISTRADOR_ROLE, contrato no pausado | Registra un recibo; revierte si el id existe o el hash es cero |
| Función      | anular(bytes32 id, bytes32 motivoHash)   | REGISTRADOR_ROLE                      | Marca el recibo como anulado                                   |
| Función      | verificar(bytes32 id) view               | Público, sin gas                      | Devuelve existe, hash, registradoEn y anulado                  |
| Función      | pause() / unpause()                      | DEFAULT_ADMIN_ROLE                    | Parada de emergencia                                           |
| Evento       | ReciboRegistrado(id, hash, registradoEn) | —                                     | Registro de un recibo                                          |
| Evento       | ReciboAnulado(id, motivoHash)            | —                                     | Anulación de un recibo                                         |

# 10. ASPECTOS TRANSVERSALES
## 10.1. Cálculo del hash
- Contenido del recibo serializado como JSON canónico (RFC 8785).

- hashRecibo = keccak256(sal ‖ contenido); sal aleatoria de 32 bytes almacenada en PostgreSQL.

- idOnchain = keccak256(uuid del recibo).

## 10.2. Seguridad
- **Autenticación:** token de acceso JWT de 15 minutos y token de renovación de 7 días en cookie httpOnly, con rotación.

- **Autorización:** guard de roles en cada endpoint; el cliente accede solo a sus datos.

- **Contraseñas:** argon2.

- **Borde:** HTTPS, cabeceras de seguridad (helmet y Caddy) y límite de solicitudes por IP.

- **Claves:** la clave de la cuenta operadora solo existe en el worker; los secretos no se versionan.

- **Recuperación de contraseña:** token de un solo uso, almacenado como hash, válido 30 minutos.

- **Sesión:** cierre tras 30 minutos de inactividad.

- **Auditoría:** bitácora de acciones de solo inserción, conservada al menos 1 año.

## 10.3. Manejo de errores
- El dominio define errores propios (por ejemplo, PolizaNoVigenteError); un filtro global los convierte en respuestas HTTP con formato uniforme.

- Los errores del worker generan reintentos; al agotarse, el recibo pasa a FALLIDO con el último mensaje de error.

## 10.4. Observabilidad
- Logs en formato JSON (nestjs-pino) con requestId por solicitud.

- /health: estado de PostgreSQL y Redis.

- /metrics: métricas de Prometheus, solo en la red interna.

- Marcas de tiempo y gas de cada recibo para medir la latencia y el costo del anclaje.

## 10.5. Pruebas
**Tabla 10-1:** Niveles de prueba

| **Nivel**              | **Alcance**                                                         | **Herramienta**           |
|------------------------|---------------------------------------------------------------------|---------------------------|
| Contrato               | Roles, duplicados, pausa, eventos, fuzzing de registrar             | Hardhat 3                 |
| Dominio y casos de uso | Reglas de negocio con puertos simulados                             | Jest                      |
| Integración            | Repositorios contra PostgreSQL; adaptador viem contra el nodo local | Jest y nodo Hardhat       |
| Extremo a extremo      | Validar pago, anclar recibo y verificarlo                           | Supertest y Playwright    |
| Rendimiento            | Tiempo de respuesta, rendimiento, capacidad y recursos              | k6, cAdvisor y Prometheus |

# 11. DECISIONES TÉCNICAS
Cada decisión se registra en docs/adr/ del repositorio.

**Tabla 11-1:** Registro de decisiones técnicas

| **ID**  | **Decisión**                                                                   | **Estado** |
|---------|--------------------------------------------------------------------------------|------------|
| ADR-001 | Monolito modular en contenedores, desplegado con Docker Compose en un VPS      | Aceptada   |
| ADR-002 | Arquitectura hexagonal por módulo de negocio en el backend                     | Aceptada   |
| ADR-003 | Red Polygon PoS; red de pruebas Amoy                                           | Aceptada   |
| ADR-004 | En la cadena se registran solo un identificador opaco y un hash con sal        | Aceptada   |
| ADR-005 | Anclaje asíncrono con outbox transaccional y cola BullMQ                       | Aceptada   |
| ADR-006 | Firma de transacciones en el servidor con una cuenta operadora del bróker      | Aceptada   |
| ADR-007 | API y worker como procesos y contenedores separados                            | Aceptada   |
| ADR-008 | Contrato inmutable, sin proxy actualizable                                     | Aceptada   |
| ADR-009 | Caddy como punto de entrada único: SPA, proxy del API y TLS en el mismo origen | Aceptada   |

# 12. ESCENARIOS DE CALIDAD
**Tabla 12-1:** Escenarios de calidad

| **ID** | **Atributo**   | **Escenario**                                                         | **Medida**                                                                     |
|--------|----------------|-----------------------------------------------------------------------|--------------------------------------------------------------------------------|
| EC-01  | Desempeño      | 20 usuarios concurrentes consultan listados                           | p95 ≤ 1 s                                                                      |
| EC-02  | Desempeño      | Un operador valida un pago                                            | p95 ≤ 1 s                                                                      |
| EC-03  | Desempeño      | Un recibo pasa de PENDIENTE_ANCLAJE a ANCLADO en Amoy                 | Media ≤ 30 s; p95 ≤ 60 s                                                       |
| EC-04  | Fiabilidad     | El worker se detiene mientras se validan 10 pagos y luego se reinicia | 10 de 10 anclados, sin duplicados                                              |
| EC-05  | Fiabilidad     | El RPC principal no responde                                          | Uso del RPC de respaldo o reintento; ningún FALLIDO por caídas menores a 5 min |
| EC-06  | Seguridad      | Acceso no autorizado al contenedor del API                            | La clave de firma no está presente                                             |
| EC-07  | Seguridad      | Alteración del monto de un recibo en la base de datos                 | La verificación pública muestra "No coincide"                                  |
| EC-08  | Mantenibilidad | Cambio de Amoy a otra red EVM                                         | Solo cambian variables de entorno y el despliegue del contrato                 |
| EC-09  | Recursos       | Operación normal en el VPS                                            | CPU ≤ 70 %; API + worker ≤ 1 GB de memoria                                     |

# 13. RIESGOS TÉCNICOS Y LIMITACIONES
**Tabla 13-1:** Riesgos técnicos

| **Riesgo**                                       | **Probabilidad** | **Impacto**                         | **Mitigación**                                          |
|--------------------------------------------------|------------------|-------------------------------------|---------------------------------------------------------|
| Caída o degradación de Amoy o Polygon PoS        | Media            | Demora en el anclaje                | Cola persistente, reintentos y barrido de pendientes    |
| Límite o caída del plan gratuito de Alchemy      | Baja             | Anclaje detenido                    | RPC público de respaldo (transporte fallback de viem)   |
| Saldo insuficiente de POL en la cuenta operadora | Media            | Transacciones rechazadas            | Monitoreo del saldo y recarga desde el faucet o compra  |
| Filtración de la clave operadora                 | Baja             | Registros no autorizados            | Revocar REGISTRADOR_ROLE y rotar la clave               |
| Pérdida de datos del servidor                    | Baja             | Pérdida del registro operativo      | Respaldo diario externo y procedimiento de restauración |
| Correos marcados como spam                       | Media            | El cliente no recibe notificaciones | Dominio con SPF, DKIM y DMARC configurados              |

## 13.1. Limitaciones conocidas
- La clave operadora se almacena como secreto de Docker; para operar en Polygon mainnet se trasladará a un servicio KMS.

- El sistema se ejecuta en un único servidor, sin alta disponibilidad.

- El envío de correos depende de la disponibilidad del proveedor SMTP; los correos no enviados se reintentan desde la cola.
