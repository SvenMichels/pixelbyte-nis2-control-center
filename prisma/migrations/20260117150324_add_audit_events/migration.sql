-- CreateEnum
CREATE TYPE "AuditEntityType" AS ENUM ('CONTROL', 'EVIDENCE');

-- CreateEnum
CREATE TYPE "AuditAction" AS ENUM ('STATUS_CHANGED', 'EVIDENCE_CREATED', 'EVIDENCE_DELETED');

-- CreateTable
CREATE TABLE "AuditEvent" (
    "id" TEXT NOT NULL,
    "action" "AuditAction" NOT NULL,
    "entityType" "AuditEntityType" NOT NULL,
    "entityId" TEXT NOT NULL,
    "controlId" TEXT,
    "actorId" TEXT,
    "meta" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AuditEvent_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "AuditEvent_controlId_idx" ON "AuditEvent"("controlId");

-- CreateIndex
CREATE INDEX "AuditEvent_actorId_idx" ON "AuditEvent"("actorId");

-- CreateIndex
CREATE INDEX "AuditEvent_entityType_entityId_idx" ON "AuditEvent"("entityType", "entityId");
