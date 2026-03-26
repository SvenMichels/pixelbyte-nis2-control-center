import { Injectable } from '@nestjs/common';
import { AuditAction, AuditEntityType, IncidentSeverity, IncidentStatus, Prisma } from '@prisma/client';
import { AuditService } from '../audit/audit.service';
import { BusinessConflictException, ResourceNotFoundException } from '../common/exceptions';
import { PrismaService } from '../prisma/prisma.service';
import { CreateIncidentDto } from './dto/create-incident.dto';
import { IncidentsQueryDto } from './dto/incidents-query.dto';
import { UpdateIncidentDto } from './dto/update-incident.dto';

@Injectable()
export class IncidentsService {
    constructor(
        private readonly prisma: PrismaService,
        private readonly audit: AuditService,
    ) {}

    async create(dto: CreateIncidentDto, actorId?: string) {
        return this.prisma.$transaction(async (tx) => {
            const incident = await tx.incident.create({
                data: {
                    title: dto.title,
                    description: dto.description ?? null,
                    severity: dto.severity ?? IncidentSeverity.LOW,
                    status: IncidentStatus.DETECTED,
                    ownerId: dto.ownerId ?? null,
                },
            });

            await this.audit.logWith(tx, {
                action: AuditAction.CREATED,
                entityType: AuditEntityType.INCIDENT,
                entityId: incident.id,
                incidentId: incident.id,
                actorId: actorId ?? null,
                meta: {
                    snapshot: {
                        title: incident.title,
                        severity: incident.severity,
                        status: incident.status,
                    },
                },
            });

            return incident;
        });
    }

    findAll(query?: IncidentsQueryDto) {
        const sortKey = query?.sortKey ?? 'createdAt';
        const sortDir = query?.sortDir === 'asc' ? 'asc' : 'desc';

        const where: Prisma.IncidentWhereInput = {
            ...(query?.status ? { status: query.status } : {}),
            ...(query?.severity ? { severity: query.severity } : {}),
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

        const orderBy: Prisma.IncidentOrderByWithRelationInput[] =
            sortKey === 'title'
                ? [{ title: sortDir }]
                : sortKey === 'status'
                    ? [{ status: sortDir }]
                    : sortKey === 'severity'
                        ? [{ severity: sortDir }]
                        : [{ createdAt: sortDir }];

        return this.prisma.incident.findMany({
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
        });
    }

    async findOne(id: string) {
        const incident = await this.prisma.incident.findUnique({
            where: { id },
            include: {
                owner: {
                    select: { id: true, email: true, role: true },
                },
                controls: {
                    include: {
                        control: {
                            select: {
                                id: true,
                                code: true,
                                title: true,
                                status: true,
                                category: true,
                                owner: { select: { id: true, email: true, role: true } },
                            },
                        },
                    },
                },
            },
        });

        if (!incident) throw new ResourceNotFoundException('Incident', id);
        return incident;
    }

    async update(id: string, dto: UpdateIncidentDto, actorId?: string) {
        return this.prisma.$transaction(async (tx) => {
            const before = await tx.incident.findUnique({ where: { id } });
            if (!before) throw new ResourceNotFoundException('Incident', id);

            const incident = await tx.incident.update({
                where: { id },
                data: {
                    ...(dto.title !== undefined ? { title: dto.title } : {}),
                    ...(dto.description !== undefined ? { description: dto.description } : {}),
                    ...(dto.severity !== undefined ? { severity: dto.severity } : {}),
                    ...(dto.ownerId !== undefined ? { ownerId: dto.ownerId } : {}),
                },
                include: {
                    owner: { select: { id: true, email: true, role: true } },
                },
            });

            const changes: Record<string, { from: unknown; to: unknown }> = {};
            if (dto.title !== undefined && before.title !== incident.title) {
                changes.title = { from: before.title, to: incident.title };
            }
            if (dto.description !== undefined && before.description !== incident.description) {
                changes.description = { from: before.description, to: incident.description };
            }
            if (dto.severity !== undefined && before.severity !== incident.severity) {
                changes.severity = { from: before.severity, to: incident.severity };
            }

            if (Object.keys(changes).length > 0) {
                await this.audit.logWith(tx, {
                    action: AuditAction.UPDATED,
                    entityType: AuditEntityType.INCIDENT,
                    entityId: incident.id,
                    incidentId: incident.id,
                    actorId: actorId ?? null,
                    meta: { changes } as Prisma.InputJsonValue,
                });
            }

            return incident;
        });
    }

    async updateStatus(id: string, status: IncidentStatus, actorId?: string) {
        return this.prisma.$transaction(async (tx) => {
            const before = await tx.incident.findUnique({
                where: { id },
                select: { id: true, status: true, resolvedAt: true },
            });
            if (!before) throw new ResourceNotFoundException('Incident', id);

            const data: Prisma.IncidentUpdateInput = { status };

            if (status === IncidentStatus.RESOLVED && !before.resolvedAt) {
                data.resolvedAt = new Date();
            }

            const incident = await tx.incident.update({
                where: { id },
                data,
                include: { owner: { select: { id: true, email: true, role: true } } },
            });

            if (before.status !== incident.status) {
                const action = status === IncidentStatus.RESOLVED
                    ? AuditAction.INCIDENT_RESOLVED
                    : (status === IncidentStatus.REPORTED_24H || status === IncidentStatus.REPORTED_72H || status === IncidentStatus.REPORT_FINAL)
                        ? AuditAction.INCIDENT_REPORTED
                        : AuditAction.STATUS_CHANGED;

                await this.audit.logWith(tx, {
                    action,
                    entityType: AuditEntityType.INCIDENT,
                    entityId: incident.id,
                    incidentId: incident.id,
                    actorId: actorId ?? null,
                    meta: {
                        changes: {
                            status: { from: before.status, to: incident.status },
                        },
                    },
                });
            }

            return incident;
        });
    }

    async remove(id: string) {
        const incident = await this.prisma.incident.findUnique({ where: { id } });
        if (!incident) throw new ResourceNotFoundException('Incident', id);

        await this.prisma.incident.delete({ where: { id } });
        return { ok: true, deletedId: id };
    }

    async linkControl(incidentId: string, controlId: string, actorId?: string) {
        return this.prisma.$transaction(async (tx) => {
            const incident = await tx.incident.findUnique({ where: { id: incidentId } });
            if (!incident) throw new ResourceNotFoundException('Incident', incidentId);

            const control = await tx.control.findUnique({ where: { id: controlId } });
            if (!control) throw new ResourceNotFoundException('Control', controlId);

            const existing = await tx.incidentControl.findUnique({
                where: { incidentId_controlId: { incidentId, controlId } },
            });
            if (existing) {
                throw new BusinessConflictException('Incident und Control sind bereits verknüpft.');
            }

            await tx.incidentControl.create({
                data: { incidentId, controlId },
            });

            await this.audit.logWith(tx, {
                action: AuditAction.RISK_CONTROL_LINKED,
                entityType: AuditEntityType.INCIDENT,
                entityId: incidentId,
                incidentId,
                actorId: actorId ?? null,
                meta: {
                    controlId,
                    controlCode: control.code,
                    controlTitle: control.title,
                },
            });

            return { ok: true };
        });
    }

    async unlinkControl(incidentId: string, controlId: string, actorId?: string) {
        return this.prisma.$transaction(async (tx) => {
            const link = await tx.incidentControl.findUnique({
                where: { incidentId_controlId: { incidentId, controlId } },
                include: { control: { select: { code: true, title: true } } },
            });

            if (!link) throw new ResourceNotFoundException('Incident-Control-Verknüpfung');

            await tx.incidentControl.delete({
                where: { incidentId_controlId: { incidentId, controlId } },
            });

            await this.audit.logWith(tx, {
                action: AuditAction.RISK_CONTROL_UNLINKED,
                entityType: AuditEntityType.INCIDENT,
                entityId: incidentId,
                incidentId,
                actorId: actorId ?? null,
                meta: {
                    controlId,
                    controlCode: link.control.code,
                    controlTitle: link.control.title,
                },
            });

            return { ok: true };
        });
    }

    async getLinkedControls(incidentId: string) {
        const incident = await this.prisma.incident.findUnique({
            where: { id: incidentId },
            include: {
                controls: {
                    include: {
                        control: {
                            include: {
                                owner: { select: { id: true, email: true, role: true } },
                            },
                        },
                    },
                },
            },
        });

        if (!incident) throw new ResourceNotFoundException('Incident', incidentId);
        return incident.controls.map((ic) => ic.control);
    }
}

