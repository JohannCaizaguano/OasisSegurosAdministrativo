-- AddColumn: nota de auditoría del operador al validar o rechazar un pago.
-- Es un dato interno: no forma parte del payload canónico del recibo ni se
-- escribe en la blockchain (ADR 0006).
ALTER TABLE "Pago" ADD COLUMN "nota" TEXT;
