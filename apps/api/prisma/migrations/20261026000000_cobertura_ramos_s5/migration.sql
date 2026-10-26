-- Sprint S5: cobertura y condiciones de la póliza (HU-51, D17) y catálogo de ramos de Oasis (D18).

-- AlterTable
ALTER TABLE "Poliza" ADD COLUMN     "cobertura" TEXT,
ADD COLUMN     "condiciones" TEXT;

-- Producción no corre el seed: el catálogo vive aquí y es idempotente.
INSERT INTO "Ramo" ("id", "codigo", "nombre", "activo", "updatedAt")
VALUES
  (gen_random_uuid(), 'VIDA', 'Vida', true, now()),
  (gen_random_uuid(), 'ASISTENCIA_MEDICA', 'Asistencia médica', true, now()),
  (gen_random_uuid(), 'VEHICULOS', 'Vehículos', true, now()),
  (gen_random_uuid(), 'EQUIPOS_ELECTRONICOS', 'Equipos electrónicos', true, now()),
  (gen_random_uuid(), 'AEREO_DRONES', 'Aéreo (drones)', true, now()),
  (gen_random_uuid(), 'EQUIPOS_MAQUINARIA', 'Equipos y maquinaria', true, now())
ON CONFLICT ("codigo") DO UPDATE
SET "nombre" = EXCLUDED."nombre", "activo" = true, "updatedAt" = now();

-- Los ramos que Oasis no comercializa se desactivan; sus pólizas se conservan (RN-09).
UPDATE "Ramo"
SET "activo" = false, "updatedAt" = now()
WHERE "codigo" IN ('SALUD', 'INCENDIO', 'FIANZAS') AND "activo";
