import { Injectable, NotFoundException } from '@nestjs/common';
import { AuditAction, AuditEntityType, RiskStatus, Prisma } from '@prisma/client';
import { AuditService } from '../audit/audit.service';
import { PrismaService } from '../prisma/prisma.service';
import { CreateRiskDto } from './dto/create-risk.dto';
import { UpdateRiskDto } from './dto/update-risk.dto';
import { RisksQueryDto } from './dto/risks-query.dto';

@Injectable()
export class RisksService {
    constructor(
        private readonly prisma: PrismaService,
        private readonly audit: AuditService,
    ) {}

    async create(dto: CreateRiskDto, actorId?: string) {
        return await this.prisma.$transaction(async (tx) => {
            const risk = await tx.risk.create({
                data: {
                    title: dto.title,
                    description: dto.description ?? null,
                    severity: dto.severity ?? 1,
                    likelihood: dto.likelihood ?? 1,
                    impact: dto.impact ?? 1,
                    status: RiskStatus.IDENTIFIED,
                    ownerId: dto.ownerId ?? null,
                },
            });

            await this.audit.logWith(tx, {
                action: AuditAction.CREATED,
                entityType: AuditEntityType.RISK,
                entityId: risk.id,
                riskId: risk.id,
                actorId: actorId ?? null,
                meta: {
                    snapshot: {
                        title: risk.title,
                        status: risk.status,
                        severity: risk.severity,
                        likelihood: risk.likelihood,
                        impact: risk.impact,
                    },
                },
            });

            return risk;
        });
    }

    findAll(query?: RisksQueryDto) {
        const sortKey = query?.sortKey ?? 'score';
        const sortDir = query?.sortDir === 'asc' ? 'asc' : 'desc';

        const where: Prisma.RiskWhereInput = {
            ...(query?.status ? { status: query.status } : {}),
            ...(query?.owner
              ? { owner: { email: { contains: query.owner, mode: 'insensitive' } } }
              : {}),
            ...(query?.search
              ? {
                  OR: [
                      { title: { contains: query.search, mode: 'insensitive' } },
                      { description: { contains: query.search, mode: 'insensitive' } },
                  ],
              }
              : {}),
        };

        const orderBy: Prisma.RiskOrderByWithRelationInput[] =
          sortKey === 'title'
            ? [ { title: sortDir } ]
            : sortKey === 'status'
              ? [ { status: sortDir } ]
              : [ { severity: sortDir }, { likelihood: sortDir } ];

        return this.prisma.risk.findMany({
            ...(typeof query?.take === 'number' ? { take: query.take } : {}),
            ...(typeof query?.skip === 'number' ? { skip: query.skip } : {}),
            where,
            orderBy,
            include: {
                owner: {
                    select: { id: true, email: true, role: true },
                },
                controls: {
                    select: {
                        controlId: true,
                        control: {
                            select: { id: true, code: true, title: true, status: true },
                        },
                    },
                },
            },
        }).then((items) => {
            const minScore = typeof query?.minScore === 'number' ? query.minScore : null;
            const maxScore = typeof query?.maxScore === 'number' ? query.maxScore : null;
            const level = query?.level ?? '';

            if (minScore === null && maxScore === null && !level) {
                return items;
            }

            return items.filter((risk) => {
                const score = this.computeScore(risk.severity, risk.likelihood);
                if (minScore !== null && score < minScore) return false;
                if (maxScore !== null && score > maxScore) return false;
                if (level) {
                    const current = this.scoreLevel(score);
                    if (current !== level) return false;
                }
                return true;
            });
        });
    }

    async findOne(id: string) {
        const risk = await this.prisma.risk.findUnique({
            where: { id },
            include: {
                owner: {
                    select: { id: true, email: true, role: true },
                },
                controls: {
                    select: {
                        controlId: true,
                        control: {
                            select: { id: true, code: true, title: true, status: true, category: true },
                        },
                    },
                },
            },
        });

        if (!risk) throw new NotFoundException('Risk not found');
        return risk;
    }

    async update(id: string, dto: UpdateRiskDto, actorId?: string) {
        return this.prisma.$transaction(async (tx) => {
            const before = await tx.risk.findUnique({
                where: { id },
            });
            if (!before) throw new NotFoundException('Risk not found');

            const risk = await tx.risk.update({
                where: { id },
                data: {
                    title: dto.title,
                    description: dto.description,
                    severity: dto.severity,
                    likelihood: dto.likelihood,
                    impact: dto.impact,
                    ownerId: dto.ownerId,
                },
                include: {
                    owner: { select: { id: true, email: true, role: true } },
                },
            });

            const changes: Record<string, { from: unknown; to: unknown }> = {};
            if (dto.title !== undefined && before.title !== risk.title) {
                changes.title = { from: before.title, to: risk.title };
            }
            if (dto.description !== undefined && before.description !== risk.description) {
                changes.description = { from: before.description, to: risk.description };
            }
            if (dto.severity !== undefined && before.severity !== risk.severity) {
                changes.severity = { from: before.severity, to: risk.severity };
            }
            if (dto.likelihood !== undefined && before.likelihood !== risk.likelihood) {
                changes.likelihood = { from: before.likelihood, to: risk.likelihood };
            }
            if (dto.impact !== undefined && before.impact !== risk.impact) {
                changes.impact = { from: before.impact, to: risk.impact };
            }

            if (Object.keys(changes).length > 0) {
                await this.audit.logWith(tx, {
                    action: AuditAction.UPDATED,
                    entityType: AuditEntityType.RISK,
                    entityId: risk.id,
                    riskId: risk.id,
                    actorId: actorId ?? null,
                    meta: { changes } as Prisma.InputJsonValue,
                });
            }

            return risk;
        });
    }

    async updateStatus(id: string, status: RiskStatus, actorId?: string) {
        return this.prisma.$transaction(async (tx) => {
            const before = await tx.risk.findUnique({
                where: { id },
                select: { id: true, status: true },
            });
            if (!before) throw new NotFoundException('Risk not found');

            const risk = await tx.risk.update({
                where: { id },
                data: { status },
                include: { owner: { select: { id: true, email: true, role: true } } },
            });

            if (before.status !== risk.status) {
                await this.audit.logWith(tx, {
                    action: AuditAction.STATUS_CHANGED,
                    entityType: AuditEntityType.RISK,
                    entityId: risk.id,
                    riskId: risk.id,
                    actorId: actorId ?? null,
                    meta: {
                        changes: {
                            status: { from: before.status, to: risk.status },
                        },
                    },
                });
            }

            return risk;
        });
    }

    async remove(id: string) {
        const risk = await this.prisma.risk.findUnique({ where: { id } });
        if (!risk) throw new NotFoundException('Risk not found');

        await this.prisma.risk.delete({ where: { id } });
        return { message: 'Risk deleted successfully' };
    }

    async linkControl(riskId: string, controlId: string, actorId?: string) {
        return this.prisma.$transaction(async (tx) => {
            // Check if risk exists
            const risk = await tx.risk.findUnique({ where: { id: riskId } });
            if (!risk) throw new NotFoundException('Risk not found');

            // Check if control exists
            const control = await tx.control.findUnique({ where: { id: controlId } });
            if (!control) throw new NotFoundException('Control not found');

            // Check if already linked
            const existing = await tx.riskControl.findUnique({
                where: {
                    riskId_controlId: { riskId, controlId },
                },
            });

            if (existing) {
                throw new Error('Risk and Control are already linked');
            }

            // Create link
            await tx.riskControl.create({
                data: { riskId, controlId },
            });

            // Log audit event
            await this.audit.logWith(tx, {
                action: AuditAction.RISK_CONTROL_LINKED,
                entityType: AuditEntityType.RISK,
                entityId: riskId,
                riskId,
                actorId: actorId ?? null,
                meta: {
                    controlId,
                    controlCode: control.code,
                    controlTitle: control.title,
                },
            });

            return { ok: true, message: 'Control linked to Risk' };
        });
    }

    async unlinkControl(riskId: string, controlId: string, actorId?: string) {
        return this.prisma.$transaction(async (tx) => {
            // Check if link exists
            const link = await tx.riskControl.findUnique({
                where: {
                    riskId_controlId: { riskId, controlId },
                },
                include: {
                    control: {
                        select: { code: true, title: true },
                    },
                },
            });

            if (!link) {
                throw new NotFoundException('Link not found');
            }

            // Delete link
            await tx.riskControl.delete({
                where: {
                    riskId_controlId: { riskId, controlId },
                },
            });

            // Log audit event
            await this.audit.logWith(tx, {
                action: AuditAction.RISK_CONTROL_UNLINKED,
                entityType: AuditEntityType.RISK,
                entityId: riskId,
                riskId,
                actorId: actorId ?? null,
                meta: {
                    controlId,
                    controlCode: link.control.code,
                    controlTitle: link.control.title,
                },
            });

            return { ok: true, message: 'Control unlinked from Risk' };
        });
    }

    async getLinkedControls(riskId: string) {
        const risk = await this.prisma.risk.findUnique({
            where: { id: riskId },
            include: {
                controls: {
                    include: {
                        control: {
                            include: {
                                owner: {
                                    select: { id: true, email: true, role: true },
                                },
                            },
                        },
                    },
                },
            },
        });

        if (!risk) throw new NotFoundException('Risk not found');

        return risk.controls.map((rc) => rc.control);
    }

    private computeScore(severity: number, likelihood: number) {
        return severity * likelihood;
    }

    private scoreLevel(score: number): 'low' | 'medium' | 'high' | 'critical' {
        if (score <= 6) return 'low';
        if (score <= 12) return 'medium';
        if (score <= 20) return 'high';
        return 'critical';
    }
}
