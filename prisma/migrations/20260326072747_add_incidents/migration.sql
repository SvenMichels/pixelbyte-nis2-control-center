-- CreateEnum
CREATE TYPE "IncidentSeverity" AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL');

-- CreateEnum
CREATE TYPE "IncidentStatus" AS ENUM ('DETECTED', 'ANALYSING', 'CONTAINED', 'RESOLVED', 'CLOSED', 'REPORTED_24H', 'REPORTED_72H', 'REPORT_FINAL');

-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "AuditAction" ADD VALUE 'INCIDENT_REPORTED';
ALTER TYPE "AuditAction" ADD VALUE 'INCIDENT_RESOLVED';

-- AlterEnum
ALTER TYPE "AuditEntityType" ADD VALUE 'INCIDENT';

-- DropForeignKey
ALTER TABLE "ControlEvidence" DROP CONSTRAINT "ControlEvidence_controlId_fkey";

-- AlterTable
ALTER TABLE "AuditEvent" ADD COLUMN     "incidentId" TEXT;

-- CreateTable
CREATE TABLE "Incident" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "severity" "IncidentSeverity" NOT NULL DEFAULT 'LOW',
    "status" "IncidentStatus" NOT NULL DEFAULT 'DETECTED',
    "reportedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "resolvedAt" TIMESTAMP(3),
    "ownerId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Incident_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "IncidentControl" (
    "incidentId" TEXT NOT NULL,
    "controlId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "IncidentControl_pkey" PRIMARY KEY ("incidentId","controlId")
);

-- CreateIndex
CREATE INDEX "Incident_status_idx" ON "Incident"("status");

-- CreateIndex
CREATE INDEX "Incident_ownerId_idx" ON "Incident"("ownerId");

-- CreateIndex
CREATE INDEX "Incident_severity_status_idx" ON "Incident"("severity", "status");

-- CreateIndex
CREATE INDEX "IncidentControl_incidentId_idx" ON "IncidentControl"("incidentId");

-- CreateIndex
CREATE INDEX "IncidentControl_controlId_idx" ON "IncidentControl"("controlId");

-- CreateIndex
CREATE INDEX "AuditEvent_incidentId_createdAt_idx" ON "AuditEvent"("incidentId", "createdAt");

-- AddForeignKey
ALTER TABLE "ControlEvidence" ADD CONSTRAINT "ControlEvidence_controlId_fkey" FOREIGN KEY ("controlId") REFERENCES "Control"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AuditEvent" ADD CONSTRAINT "AuditEvent_incidentId_fkey" FOREIGN KEY ("incidentId") REFERENCES "Incident"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Incident" ADD CONSTRAINT "Incident_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "IncidentControl" ADD CONSTRAINT "IncidentControl_incidentId_fkey" FOREIGN KEY ("incidentId") REFERENCES "Incident"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "IncidentControl" ADD CONSTRAINT "IncidentControl_controlId_fkey" FOREIGN KEY ("controlId") REFERENCES "Control"("id") ON DELETE CASCADE ON UPDATE CASCADE;
