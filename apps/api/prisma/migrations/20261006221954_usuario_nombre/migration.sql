-- AlterTable en tres pasos para no fallar sobre bases ya sembradas (D3).
ALTER TABLE "Usuario" ADD COLUMN "nombre" TEXT;

-- CLIENTE: nombre del cliente vinculado.
UPDATE "Usuario" u
SET "nombre" = COALESCE(c."razonSocial", NULLIF(TRIM(c."nombres" || ' ' || c."apellidos"), ''))
FROM "Cliente" c
WHERE u."clienteId" = c.id;

-- Personal: parte local del correo.
UPDATE "Usuario"
SET "nombre" = split_part("email", '@', 1)
WHERE "nombre" IS NULL;

ALTER TABLE "Usuario" ALTER COLUMN "nombre" SET NOT NULL;
