# Registros de sprint

El proyecto se organiza en 9 sprints de dos semanas (S1 a S9) entre el 07/09/2026 y el 08/01/2027,
con la asignación de la tabla 6-1 de [PRODUCT_BACKLOG.md](../referencia/PRODUCT_BACKLOG.md). Cada
sprint tiene un plan (`sprint-sN-plan.md`, el Sprint Backlog) y, al cerrarse, un informe
(`sprint-sN.md`). Un sprint se ejecuta en etapas secuenciales (A, B y, si se agrega trabajo a
mitad del sprint, C), cada una con su commit; las decisiones (D) y las tareas (T) se numeran de
forma continua en todo el plan.

| Sprint | Fechas                  | Historias                                                                   | Plan                                             | Informe        | Estado                                                                                           |
| ------ | ----------------------- | --------------------------------------------------------------------------- | ------------------------------------------------ | -------------- | ------------------------------------------------------------------------------------------------ |
| S1     | 07/09 – 18/09/2026      | HT-01, HT-03, HT-02, HU-45                                                  | `sprint-s1-plan.md`                              | `sprint-s1.md` | Cerrado                                                                                          |
| S2     | 21/09 – 02/10/2026      | HU-01, HU-02, HU-03, HU-06, HU-32, HT-04, HU-04, HU-07, HU-11               | `sprint-s2-plan.md`                              | `sprint-s2.md` | Cerrado                                                                                          |
| S3     | 05/10 – 16/10/2026      | HU-08, HU-09, HU-12, HU-13, HU-14, HT-13                                    | `sprint-s3-plan.md`                              | `sprint-s3.md` | Cerrado; HT-13 pasa a S4 como deuda                                                              |
| S4     | 19/10 – 30/10/2026      | HT-13, HU-16, HU-18, HU-19, HU-35, HU-37, HT-14, HU-22, HU-23, HU-42, HT-15 | `sprint-s4-plan.md`, `sprint-s4-etapa-c-plan.md` | `sprint-s4.md` | Cerrado; HT-15.1 pendiente del autor en Amoy; Etapa C (§13) pendiente de la aprobación del autor |
| S5     | 02/11 – 13/11/2026      | HU-24, HU-25, HU-26, HT-16, HU-28, HU-36, HU-20, HU-38, HU-51               | `sprint-s5-plan.md`                              | `sprint-s5.md` | Cerrado el 12/11/2026; T22 (punto de control visual) pendiente del autor                         |
| S6     | 16/11 – 27/11/2026      | HU-05, HU-10, HU-15, HU-33, HU-34, HU-53, HT-12, HU-27, HU-29, HU-39        | `sprint-s6-plan.md`                              | —              | Planificado                                                                                      |
| S7     | 30/11 – 11/12/2026      | HT-05, HU-50, HU-31, HT-06, HU-17                                           | `sprint-s7-plan.md`                              | —              | Planificado                                                                                      |
| S8     | 14/12 – 25/12/2026      | HT-07, HT-08, HU-43, HU-52, HT-09, HU-21, HU-30                             | `sprint-s8-plan.md`                              | —              | Planificado                                                                                      |
| S9     | 28/12/2026 – 08/01/2027 | HT-10, HU-47, HT-11, HU-41, HU-46, HU-40, HU-44                             | `sprint-s9-plan.md`                              | —              | Planificado                                                                                      |

Las ramas y los commits de S1 a S3 conservan los nombres con que se crearon, uno por etapa
(`feat/sprint-01-…` a `feat/sprint-05-…`); cada informe indica qué rama y qué commit corresponde a
cada etapa.
