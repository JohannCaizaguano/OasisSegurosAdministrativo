# ADR-001 · Monolito modular en contenedores, desplegado con Docker Compose en un VPS

- **Estado**: aceptado
- **Fecha**: 2026-09
- **Sprint**: 1

## Contexto

El SRPP lo desarrolla una sola persona (25 horas por semana) y se evalúa como trabajo
de titulación. La operación real del bróker es de escala pequeña: personal
administrativo, los asegurados del bróker y verificadores externos. El despliegue
objetivo es **un VPS de 4 vCPU y 8 GB** (OVHcloud VPS-1) y los escenarios de calidad
(EC-01…EC-09) se miden con 20 y 50 usuarios concurrentes.

La arquitectura (secciones 2.1, 3 y 5-1) exige: monolito modular, contenedores con
Docker Compose en un servidor propio y bajo costo de operación (RNF-22).

## Decisión

- Un **único backend desplegable** (NestJS) dividido en módulos de negocio
  (`auth`, `usuarios`, `clientes`, `polizas`, `pagos`, `recibos`, …), no
  microservicios.
- Todos los componentes se orquestan con **Docker Compose** en un solo VPS: `web`
  (Caddy), `api`, `worker`, `postgres`, `redis` y la tarea `migrate`. Caddy es el
  único punto de entrada público (ADR-009).
- Sin Kubernetes, sin orquestadores administrados y sin PaaS: el objetivo es
  reproducibilidad con la mínima superficie operativa.

## Alternativas descartadas

- **Microservicios**: la comunicación entre servicios, el descubrimiento, la
  observabilidad y el despliegue multi-contenedor no se justifican para el tamaño del
  sistema ni para el tiempo del proyecto.
- **Monolito sin módulos**: menos archivos, pero impide verificar por reglas estáticas
  la separación entre dominios (que sí exige el RNF-17 de mantenibilidad).
- **PaaS gestionado (Render, Railway, etc.)**: costo mensual y control limitado del
  entorno; la evaluación pide desplegar en un VPS propio.
- **Serverless**: la cola de anclaje, el worker con la clave operadora y las tareas
  programadas encajan mal con el modelo de ejecución y el arranque en frío.

## Consecuencias

- Positivas: un solo artefacto desplegable; operación barata y reproducible; los
  límites entre módulos se pueden hacer cumplir en CI (ADR-002).
- Negativas: no hay alta disponibilidad ni escalado horizontal (limitación conocida
  en ARQUITECTURA §13.1); el crecimiento futuro exige escalar verticalmente o mover
  módulos a servicios independientes.
