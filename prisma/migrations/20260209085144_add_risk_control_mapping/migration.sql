-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "AuditAction" ADD VALUE 'RISK_CONTROL_LINKED';
ALTER TYPE "AuditAction" ADD VALUE 'RISK_CONTROL_UNLINKED';

-- CreateTable
CREATE TABLE "RiskControl" (
    "riskId" TEXT NOT NULL,
    "controlId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RiskControl_pkey" PRIMARY KEY ("riskId","controlId")
);

-- CreateIndex
CREATE INDEX "RiskControl_riskId_idx" ON "RiskControl"("riskId");

-- CreateIndex
CREATE INDEX "RiskControl_controlId_idx" ON "RiskControl"("controlId");

-- AddForeignKey
ALTER TABLE "RiskControl" ADD CONSTRAINT "RiskControl_riskId_fkey" FOREIGN KEY ("riskId") REFERENCES "Risk"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RiskControl" ADD CONSTRAINT "RiskControl_controlId_fkey" FOREIGN KEY ("controlId") REFERENCES "Control"("id") ON DELETE CASCADE ON UPDATE CASCADE;
