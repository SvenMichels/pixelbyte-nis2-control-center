import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { AuditAction, AuditEntityType, EvidenceType, Prisma } from '@prisma/client';
import { AuditService } from '../../audit/audit.service';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateEvidenceDto } from './dto/create-evidence.dto';

@Injectable()
export class ControlsEvidenceService {
    constructor(
      private readonly prisma: PrismaService,
      private readonly audit: AuditService,
    ) {
    }

    async create(controlId: string, dto: CreateEvidenceDto, actorId?: string) {
        this.validate(dto);

        return this.prisma.$transaction(async (tx: Prisma.TransactionClient) => {
            await this.ensureControlExistsTx(tx, controlId);

            const evidence = await tx.controlEvidence.create({
                data: {
                    controlId,
                    type: dto.type,
                    note: dto.note ?? null,
                    link: dto.link ?? null,
                },
            });

            await this.audit.logWith(tx, {
                action: AuditAction.EVIDENCE_CREATED,
                entityType: AuditEntityType.EVIDENCE,
                entityId: evidence.id,
                controlId,
                actorId: actorId ?? null,
                meta: {
                    snapshot: {
                        evidenceId: evidence.id,
                        type: evidence.type,
                        note: evidence.note ? this.truncate(evidence.note, 200) : null,
                        link: evidence.link ?? null,
                    },
                },
            });

            return evidence;
        });
    }

    async findAll(controlId: string) {
        await this.ensureControlExists(controlId);

        return this.prisma.controlEvidence.findMany({
            where: { controlId },
            orderBy: { createdAt: 'desc' },
        });
    }

    async remove(controlId: string, evidenceId: string, actorId?: string) {
        return this.prisma.$transaction(async (tx: Prisma.TransactionClient) => {
            await this.ensureControlExistsTx(tx, controlId);

            const ev = await tx.controlEvidence.findFirst({
                where: { id: evidenceId, controlId },
                select: { id: true, type: true, note: true, link: true },
            });

            if (!ev) throw new NotFoundException('Evidence not found');

            await tx.controlEvidence.delete({ where: { id: evidenceId } });

            await this.audit.logWith(tx, {
                action: AuditAction.EVIDENCE_DELETED,
                entityType: AuditEntityType.EVIDENCE,
                entityId: evidenceId,
                controlId,
                actorId: actorId ?? null,
                meta: {
                    snapshot: {
                        evidenceId: ev.id,
                        type: ev.type,
                        note: ev.note ? this.truncate(ev.note, 200) : null,
                        link: ev.link,
                    },
                },
            });

            return { ok: true, deletedId: evidenceId };
        });
    }

    async removeAll(controlId: string, actorId?: string) {
        return this.prisma.$transaction(async (tx: Prisma.TransactionClient) => {
            await this.ensureControlExistsTx(tx, controlId);

            const res = await tx.controlEvidence.deleteMany({
                where: { controlId },
            });

            if (res.count > 0) {
                await this.audit.logWith(tx, {
                    action: AuditAction.EVIDENCE_DELETED,
                    entityType: AuditEntityType.EVIDENCE,
                    entityId: 'BULK',
                    controlId,
                    actorId: actorId ?? null,
                    meta: { bulk: true, deletedCount: res.count },
                });
            }

            return { ok: true, deletedCount: res.count };
        });
    }

    private validate(dto: CreateEvidenceDto) {
        if (dto.type === EvidenceType.NOTE && !dto.note?.trim()) {
            throw new BadRequestException('note is required when type=NOTE');
        }
        if (dto.type === EvidenceType.LINK && !dto.link?.trim()) {
            throw new BadRequestException('link is required when type=LINK');
        }
    }

    private async ensureControlExists(controlId: string) {
        const exists = await this.prisma.control.findUnique({
            where: { id: controlId },
            select: { id: true },
        });
        if (!exists) throw new NotFoundException('Control not found');
    }

    private async ensureControlExistsTx(tx: Prisma.TransactionClient, controlId: string) {
        const exists = await tx.control.findUnique({
            where: { id: controlId },
            select: { id: true },
        });
        if (!exists) throw new NotFoundException('Control not found');
    }

    private truncate(value: string, max: number) {
        const v = value.trim();
        return v.length <= max ? v : `${v.slice(0, max)}…`;
    }
}
