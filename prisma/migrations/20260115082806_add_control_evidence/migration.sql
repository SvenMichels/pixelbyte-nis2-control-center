-- CreateEnum
CREATE TYPE "EvidenceType" AS ENUM ('NOTE', 'LINK');

-- CreateTable
CREATE TABLE "ControlEvidence" (
    "id" TEXT NOT NULL,
    "controlId" TEXT NOT NULL,
    "type" "EvidenceType" NOT NULL DEFAULT 'NOTE',
    "note" TEXT,
    "link" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ControlEvidence_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ControlEvidence_controlId_idx" ON "ControlEvidence"("controlId");

-- AddForeignKey
ALTER TABLE "ControlEvidence" ADD CONSTRAINT "ControlEvidence_controlId_fkey" FOREIGN KEY ("controlId") REFERENCES "Control"("id") ON DELETE CASCADE ON UPDATE CASCADE;
