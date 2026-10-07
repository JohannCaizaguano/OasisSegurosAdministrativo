# ADR-017 · Validación de identificaciones ecuatorianas (RN-11)

- **Estado**: aceptado
- **Fecha**: 2026-10
- **Sprint**: 4

## Contexto

HU-07 exige validar la cédula, el RUC y el pasaporte del cliente "según RN-11", pero el texto de esa
regla vive en el ERS `.docx`, que no está en el repositorio; hasta S3 el esquema solo comprobaba una
longitud de 5 a 20 caracteres. HU-11 pide además un RUC de 13 dígitos para las aseguradoras. Hace
falta una sola regla, verificable con pruebas, para ambos casos.

## Decisión

- Las validaciones viven en `@oasis/shared` (`validacion/identificacion.ts`) y las usan los
  esquemas Zod de cliente y aseguradora: el API y la SPA aplican la misma regla.
- **Cédula:** 10 dígitos; provincia 01–24 o 30; tercer dígito menor que 6; dígito verificador
  módulo 10 (coeficientes 2,1,2,1,2,1,2,1,2).
- **RUC:** 13 dígitos terminados en `001` y provincia válida. Tercer dígito 0–5 (persona natural):
  los 10 primeros son una cédula válida. Tercer dígito 6 (pública) o 9 (sociedad privada): solo
  estructura, sin módulo 11. Cualquier otro tercer dígito es inválido.
- **Pasaporte:** 5 a 20 caracteres alfanuméricos; se guarda en mayúsculas.
- Antes de validar se quitan los espacios de los extremos. Los mensajes de error están en español y
  señalan el campo `identificacion` (o `ruc`).
- Las aseguradoras usan la misma regla de RUC.

## Alternativas descartadas

- **Módulo 11 estricto en el RUC de sociedades:** el SRI emite RUC de sociedades que no cumplen el
  dígito verificador; el sistema rechazaría clientes y aseguradoras reales.
- **Solo longitud:** no cumple RN-11 ni detecta errores de digitación en la cédula.
- **Consultar el SRI en línea:** agrega una dependencia externa al registro, sin API oficial
  estable y sin necesidad para el alcance del proyecto.

## Consecuencias

- Positivas: una sola regla en un solo archivo, con pruebas, para el API y la SPA; el operador ve el
  error al escribir, antes de enviar.
- Negativas: un RUC de sociedad mal digitado con estructura correcta pasa la validación. Los datos de
  prueba deben usar identificaciones válidas (`cedulaValida` en `apps/api/test/identificaciones.ts`).
  Si el texto de RN-11 del ERS resulta más estricto, se ajusta este archivo y este ADR.
