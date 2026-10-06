# ADR-001 · Monolito modular en contenedores, desplegado con Docker Compose en un VPS

- **Estado**: aceptado
- **Fecha**: 2026-09
- **Sprint**: 1

## Contexto

El SRPP lo desarrolla una sola persona (25 horas por semana) y se evalúa como trabajo de
titulación. La operación es de escala pequeña (personal administrativo y asegurados,
todos con inicio de sesión) sobre **un VPS de 4 vCPU y 8 GB**; los escenarios de calidad
(EC-01…EC-09) se miden con 20 y 50 usuarios concurrentes. La arquitectura (secciones 2.1,
3 y 5-1) exige monolito modular, contenedores con Docker Compose en servidor propio y
bajo costo de operación (RNF-22).

## Decisión

- Un **único backend desplegable** (NestJS) dividido en módulos de negocio (`auth`,
  `usuarios`, `clientes`, `polizas`, `pagos`, `recibos`, …), no microservicios.
- Todos los componentes se orquestan con **Docker Compose** en un solo VPS: `web`
  (Caddy), `api`, `worker`, `postgres`, `redis` y la tarea `migrate`; Caddy es el único
  punto de entrada público (ADR-009).
- Sin Kubernetes, orquestadores administrados ni PaaS: reproducibilidad con la mínima
  superficie operativa.

## Alternativas descartadas

- **Microservicios**: comunicación, descubrimiento, observabilidad y despliegue
  multi-contenedor no se justifican para el tamaño del sistema ni el tiempo del proyecto.
- **Monolito sin módulos**: menos archivos, pero impide verificar por reglas estáticas la
  separación entre dominios (RNF-17 de mantenibilidad).
- **PaaS gestionado (Render, Railway…)**: costo mensual y control limitado; la evaluación
  pide desplegar en un VPS propio.
- **Serverless**: la cola de anclaje, el worker con la clave operadora y las tareas
  programadas encajan mal con el modelo de ejecución y el arranque en frío.

## Consecuencias

- Positivas: un solo artefacto desplegable; operación barata y reproducible; los límites
  entre módulos se hacen cumplir en CI (ADR-002).
- Negativas: sin alta disponibilidad ni escalado horizontal (ARQUITECTURA §13.1); crecer
  exige escalar verticalmente o mover módulos a servicios independientes.
