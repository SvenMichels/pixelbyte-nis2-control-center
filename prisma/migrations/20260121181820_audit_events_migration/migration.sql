-- DropIndex
DROP INDEX "AuditEvent_actorId_idx";

-- DropIndex
DROP INDEX "AuditEvent_controlId_idx";

-- DropIndex
DROP INDEX "AuditEvent_entityType_entityId_idx";

-- CreateIndex
CREATE INDEX "AuditEvent_controlId_createdAt_idx" ON "AuditEvent"("controlId", "createdAt");

-- CreateIndex
CREATE INDEX "AuditEvent_entityType_entityId_createdAt_idx" ON "AuditEvent"("entityType", "entityId", "createdAt");

-- CreateIndex
CREATE INDEX "AuditEvent_actorId_createdAt_idx" ON "AuditEvent"("actorId", "createdAt");
