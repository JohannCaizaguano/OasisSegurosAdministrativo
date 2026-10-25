-- Sprint S4: autor y fecha propios del rechazo (D8), referencia única por póliza (D6) y cuota
-- única por la prima para las pólizas existentes (D11, ADR-020).

-- AlterTable
ALTER TABLE "Pago" ADD COLUMN     "rechazadoEn" TIMESTAMP(3),
ADD COLUMN     "rechazadoPorId" UUID;

-- Los rechazos anteriores guardaban su autor en los campos de la validación.
UPDATE "Pago"
SET "rechazadoPorId" = "validadoPorId",
    "rechazadoEn" = "validadoEn",
    "validadoPorId" = NULL,
    "validadoEn" = NULL
WHERE "estado" = 'RECHAZADO';

-- Referencias repetidas en la misma póliza (datos de desarrollo): la segunda y siguientes
-- reciben el sufijo -<n> antes de crear el índice único.
UPDATE "Pago" p
SET "referencia" = p."referencia" || '-' || d.n
FROM (
  SELECT "id", ROW_NUMBER() OVER (PARTITION BY "polizaId", "referencia" ORDER BY "createdAt", "id") AS n
  FROM "Pago"
  WHERE "referencia" IS NOT NULL
) d
WHERE p."id" = d."id" AND d.n > 1;

-- CreateIndex
CREATE INDEX "Pago_rechazadoPorId_idx" ON "Pago"("rechazadoPorId");

-- CreateIndex
CREATE UNIQUE INDEX "Pago_polizaId_referencia_key" ON "Pago"("polizaId", "referencia");

-- AddForeignKey
ALTER TABLE "Pago" ADD CONSTRAINT "Pago_rechazadoPorId_fkey" FOREIGN KEY ("rechazadoPorId") REFERENCES "Usuario"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Toda póliza tiene al menos una cuota: la prima total con vencimiento en su inicio.
INSERT INTO "Cuota" ("id", "polizaId", "numero", "valor", "fechaVencimiento", "estado", "updatedAt")
SELECT gen_random_uuid(), p."id", 1, p."primaTotal", p."fechaInicio", 'PENDIENTE', now()
FROM "Poliza" p
WHERE NOT EXISTS (SELECT 1 FROM "Cuota" c WHERE c."polizaId" = p."id");
