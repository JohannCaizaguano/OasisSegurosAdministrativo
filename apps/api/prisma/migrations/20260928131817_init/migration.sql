-- CreateEnum
CREATE TYPE "Rol" AS ENUM ('ADMIN', 'OPERADOR', 'CLIENTE');

-- CreateEnum
CREATE TYPE "TipoIdentificacion" AS ENUM ('CEDULA', 'RUC', 'PASAPORTE');

-- CreateEnum
CREATE TYPE "EstadoPoliza" AS ENUM ('VIGENTE', 'VENCIDA', 'CANCELADA');

-- CreateEnum
CREATE TYPE "MetodoPago" AS ENUM ('TRANSFERENCIA', 'EFECTIVO', 'TARJETA', 'CHEQUE');

-- CreateEnum
CREATE TYPE "EstadoPago" AS ENUM ('REGISTRADO', 'VALIDADO', 'RECHAZADO');

-- CreateEnum
CREATE TYPE "EstadoRecibo" AS ENUM ('PENDIENTE_ANCLAJE', 'ENVIADO', 'ANCLADO', 'FALLIDO', 'ANULADO');

-- CreateTable
CREATE TABLE "Usuario" (
    "id" UUID NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "rol" "Rol" NOT NULL,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "clienteId" UUID,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Usuario_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Aseguradora" (
    "id" UUID NOT NULL,
    "nombre" TEXT NOT NULL,
    "ruc" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Aseguradora_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Cliente" (
    "id" UUID NOT NULL,
    "tipoIdentificacion" "TipoIdentificacion" NOT NULL,
    "identificacion" TEXT NOT NULL,
    "nombres" TEXT,
    "apellidos" TEXT,
    "razonSocial" TEXT,
    "email" TEXT NOT NULL,
    "telefono" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Cliente_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Poliza" (
    "id" UUID NOT NULL,
    "numero" TEXT NOT NULL,
    "clienteId" UUID NOT NULL,
    "aseguradoraId" UUID NOT NULL,
    "ramo" TEXT NOT NULL,
    "primaTotal" DECIMAL(12,2) NOT NULL,
    "fechaInicio" DATE NOT NULL,
    "fechaFin" DATE NOT NULL,
    "estado" "EstadoPoliza" NOT NULL DEFAULT 'VIGENTE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Poliza_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Pago" (
    "id" UUID NOT NULL,
    "polizaId" UUID NOT NULL,
    "monto" DECIMAL(12,2) NOT NULL,
    "fechaPago" DATE NOT NULL,
    "metodo" "MetodoPago" NOT NULL,
    "referencia" TEXT,
    "estado" "EstadoPago" NOT NULL DEFAULT 'REGISTRADO',
    "validadoPorId" UUID,
    "validadoEn" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Pago_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Recibo" (
    "id" UUID NOT NULL,
    "codigo" TEXT NOT NULL,
    "pagoId" UUID NOT NULL,
    "idOnchain" TEXT NOT NULL,
    "hashRecibo" TEXT NOT NULL,
    "sal" TEXT NOT NULL,
    "payloadCanonico" TEXT NOT NULL,
    "estado" "EstadoRecibo" NOT NULL DEFAULT 'PENDIENTE_ANCLAJE',
    "txHash" TEXT,
    "blockNumber" BIGINT,
    "gasUsed" BIGINT,
    "effectiveGasPrice" BIGINT,
    "chainId" INTEGER NOT NULL,
    "contractAddress" TEXT NOT NULL,
    "intentos" INTEGER NOT NULL DEFAULT 0,
    "ultimoError" TEXT,
    "creadoEn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "enviadoEn" TIMESTAMP(3),
    "ancladoEn" TIMESTAMP(3),
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Recibo_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Usuario_email_key" ON "Usuario"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Usuario_clienteId_key" ON "Usuario"("clienteId");

-- CreateIndex
CREATE INDEX "Usuario_rol_idx" ON "Usuario"("rol");

-- CreateIndex
CREATE UNIQUE INDEX "Aseguradora_ruc_key" ON "Aseguradora"("ruc");

-- CreateIndex
CREATE UNIQUE INDEX "Cliente_identificacion_key" ON "Cliente"("identificacion");

-- CreateIndex
CREATE INDEX "Cliente_email_idx" ON "Cliente"("email");

-- CreateIndex
CREATE INDEX "Cliente_tipoIdentificacion_idx" ON "Cliente"("tipoIdentificacion");

-- CreateIndex
CREATE UNIQUE INDEX "Poliza_numero_key" ON "Poliza"("numero");

-- CreateIndex
CREATE INDEX "Poliza_clienteId_idx" ON "Poliza"("clienteId");

-- CreateIndex
CREATE INDEX "Poliza_aseguradoraId_idx" ON "Poliza"("aseguradoraId");

-- CreateIndex
CREATE INDEX "Poliza_estado_idx" ON "Poliza"("estado");

-- CreateIndex
CREATE INDEX "Poliza_fechaFin_idx" ON "Poliza"("fechaFin");

-- CreateIndex
CREATE INDEX "Pago_polizaId_idx" ON "Pago"("polizaId");

-- CreateIndex
CREATE INDEX "Pago_estado_idx" ON "Pago"("estado");

-- CreateIndex
CREATE INDEX "Pago_validadoPorId_idx" ON "Pago"("validadoPorId");

-- CreateIndex
CREATE INDEX "Pago_fechaPago_idx" ON "Pago"("fechaPago");

-- CreateIndex
CREATE UNIQUE INDEX "Recibo_codigo_key" ON "Recibo"("codigo");

-- CreateIndex
CREATE UNIQUE INDEX "Recibo_pagoId_key" ON "Recibo"("pagoId");

-- CreateIndex
CREATE INDEX "Recibo_estado_idx" ON "Recibo"("estado");

-- CreateIndex
CREATE INDEX "Recibo_creadoEn_idx" ON "Recibo"("creadoEn");

-- AddForeignKey
ALTER TABLE "Usuario" ADD CONSTRAINT "Usuario_clienteId_fkey" FOREIGN KEY ("clienteId") REFERENCES "Cliente"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Poliza" ADD CONSTRAINT "Poliza_clienteId_fkey" FOREIGN KEY ("clienteId") REFERENCES "Cliente"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Poliza" ADD CONSTRAINT "Poliza_aseguradoraId_fkey" FOREIGN KEY ("aseguradoraId") REFERENCES "Aseguradora"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Pago" ADD CONSTRAINT "Pago_polizaId_fkey" FOREIGN KEY ("polizaId") REFERENCES "Poliza"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Pago" ADD CONSTRAINT "Pago_validadoPorId_fkey" FOREIGN KEY ("validadoPorId") REFERENCES "Usuario"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Recibo" ADD CONSTRAINT "Recibo_pagoId_fkey" FOREIGN KEY ("pagoId") REFERENCES "Pago"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
