import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { AuditAction, AuditEntityType, ControlStatus, Prisma } from '@prisma/client';
import { AuditService } from '../audit/audit.service';
import { ReadinessByCategoryDto } from '../nis2/dto/readiness-by-category.dto';
import { ReadinessBreakdownDto, ReadinessByStatusDto, ReadinessResponseDto } from '../nis2/dto/readiness-response.dto';
import { PrismaService } from '../prisma/prisma.service';
import { CreateControlDto } from './dto/create-control.dto';
import { ControlsQueryDto } from './dto/controls-query.dto';

@Injectable()
export class ControlsService {
    constructor(
      private readonly prisma: PrismaService,
      private readonly audit: AuditService,
    ) {
    }

    async create(dto: CreateControlDto, actorId?: string) {
        try {
            return await this.prisma.$transaction(async (tx) => {
                const control = await tx.control.create({
                    data: {
                        code: dto.code,
                        title: dto.title,
                        description: dto.description ?? null,
                        status: dto.status ?? ControlStatus.NOT_STARTED,
                        ownerId: dto.ownerId ?? null,
                    },
                });

                await this.audit.logWith(tx, {
                    action: AuditAction.CREATED,
                    entityType: AuditEntityType.CONTROL,
                    entityId: control.id,
                    controlId: control.id,
                    actorId: actorId ?? null,
                    meta: {
                        snapshot: { code: control.code, title: control.title, status: control.status },
                    },
                });

                return control;
            });
        } catch (error) {
            if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
                throw new ConflictException('Control code already exists');
            }
            throw error;
        }
    }

    findAll(query?: ControlsQueryDto) {
        const take = query?.take ?? 50;
        const skip = query?.skip;
        const sortKey = query?.sortKey ?? 'code';
        const sortDir = query?.sortDir === 'desc' ? 'desc' : 'asc';
        const cursor = query?.cursor;

        const where: Prisma.ControlWhereInput = {
            ...(query?.status && query.status.length > 0 ? { status: { in: query.status } } : {}),
            ...(query?.category ? { category: query.category } : {}),
            ...(query?.owner
              ? { owner: { email: { contains: query.owner, mode: 'insensitive' } } }
              : {}),
            ...(query?.search
              ? {
                  OR: [
                      { code: { contains: query.search, mode: 'insensitive' } },
                      { title: { contains: query.search, mode: 'insensitive' } },
                  ],
              }
              : {}),
        };

        const orderBy: Prisma.ControlOrderByWithRelationInput[] =
          sortKey === 'title'
            ? [ { title: sortDir }, { code: 'asc' } ]
            : sortKey === 'status'
              ? [ { status: sortDir }, { code: 'asc' } ]
              : sortKey === 'category'
                ? [ { category: sortDir }, { code: 'asc' } ]
                : [ { code: sortDir }, { id: sortDir } ];

        const cursorFilter = cursor && sortKey === 'code'
          ? this.buildCursorWhere(cursor, sortDir)
          : null;

        const finalWhere: Prisma.ControlWhereInput = cursorFilter
          ? { AND: [ where, cursorFilter ] }
          : where;

        return this.prisma.control.findMany({
            ...(typeof skip === 'number' && !cursorFilter ? { skip } : {}),
            take: take + 1,
            where: finalWhere,
            orderBy,
            include: {
                owner: {
                    select: { id: true, email: true, role: true },
                },
            },
        }).then((itemsPlus) => {
            const hasMore = itemsPlus.length > take;
            const items = hasMore ? itemsPlus.slice(0, take) : itemsPlus;
            const nextCursor = hasMore ? this.encodeCursor(items[items.length - 1]) : null;
            return { items, nextCursor };
        });
    }

    private encodeCursor(control: { code: string; id: string }) {
        const raw = `${control.code}|${control.id}`;
        return Buffer.from(raw, 'utf8').toString('base64url');
    }

    private decodeCursor(cursor: string): { code: string; id: string } {
        const raw = Buffer.from(cursor, 'base64url').toString('utf8');
        const [ code, id ] = raw.split('|');
        if (!code || !id) {
            throw new Error('Invalid cursor');
        }
        return { code, id };
    }

    private buildCursorWhere(cursor: string, dir: 'asc' | 'desc'): Prisma.ControlWhereInput {
        const decoded = this.decodeCursor(cursor);
        const operator = dir === 'desc' ? 'lt' : 'gt';

        return {
            OR: [
                { code: { [operator]: decoded.code } },
                { code: decoded.code, id: { [operator]: decoded.id } },
            ],
        };
    }

    async findOne(id: string) {
        const control = await this.prisma.control.findUnique({
            where: { id },
            include: {
                owner: {
                    select: { id: true, email: true, role: true },
                },
                risks: {
                    include: {
                        risk: {
                            select: {
                                id: true,
                                title: true,
                                description: true,
                                status: true,
                                severity: true,
                                likelihood: true,
                                impact: true,
                                owner: { select: { id: true, email: true, role: true } },
                            },
                        },
                    },
                },
            },
        });

        if (!control) throw new NotFoundException('Control not found');
        return control;
    }

    async updateStatus(id: string, status: ControlStatus, actorId?: string) {
        return this.prisma.$transaction(async (tx) => {
            const before = await tx.control.findUnique({
                where: { id },
                select: { id: true, status: true },
            });
            if (!before) throw new NotFoundException('Control not found');

            const updated = await tx.control.update({
                where: { id },
                data: { status },
                include: { owner: { select: { id: true, email: true, role: true } } },
            });

            if (before.status !== updated.status) {
                await this.audit.logWith(tx, {
                    action: AuditAction.STATUS_CHANGED,
                    entityType: AuditEntityType.CONTROL,
                    entityId: updated.id,
                    controlId: updated.id,
                    actorId: actorId ?? null,
                    meta: {
                        changes: {
                            status: { from: before.status, to: updated.status },
                        },
                    },
                });
            }

            return updated;
        });
    }

    async remove(id: string) {
        await this.findOne(id);
        await this.prisma.control.delete({ where: { id } });
        return { ok: true, deletedId: id };
    }

    async findAllForReadiness() {
        return this.prisma.control.findMany({
            select: { status: true },
        });
    }

    async getReadiness(): Promise<ReadinessResponseDto> {
        const grouped = await this.prisma.control.groupBy({
            by: [ 'status' ],
            _count: { _all: true },
        });

        const counts = this.toCountMap(grouped);

        const implemented = counts[ControlStatus.IMPLEMENTED];
        const inProgress = counts[ControlStatus.IN_PROGRESS];
        const notStarted = counts[ControlStatus.NOT_STARTED];
        const notApplicable = counts[ControlStatus.NOT_APPLICABLE];

        const total = implemented + inProgress + notStarted + notApplicable;
        const totalApplicable = implemented + inProgress + notStarted;

        const score = this.computeScore({
            implemented,
            inProgress,
            notStarted,
            totalApplicable,
        });

        const breakdown: ReadinessBreakdownDto = {
            implemented,
            inProgress,
            notStarted,
            notApplicable,
            total,
            totalApplicable,
        };

        const byStatus: ReadinessByStatusDto[] = [
            { status: ControlStatus.IMPLEMENTED, count: implemented },
            { status: ControlStatus.IN_PROGRESS, count: inProgress },
            { status: ControlStatus.NOT_STARTED, count: notStarted },
            { status: ControlStatus.NOT_APPLICABLE, count: notApplicable },
        ];

        return {
            score,
            scorePercent: Math.round(score * 100),
            breakdown,
            byStatus,
        };
    }

    private toCountMap(
      grouped: Array<{ status: ControlStatus; _count: { _all: number } }>,
    ): Record<ControlStatus, number> {
        const base: Record<ControlStatus, number> = {
            NOT_STARTED: 0,
            IN_PROGRESS: 0,
            IMPLEMENTED: 0,
            NOT_APPLICABLE: 0,
        };

        for (const g of grouped) {
            base[g.status] = g._count._all;
        }
        return base;
    }

    private computeScore(params: {
        implemented: number;
        inProgress: number;
        notStarted: number;
        totalApplicable: number;
    }): number {
        const { implemented, inProgress, totalApplicable } = params;

        if (totalApplicable === 0) return 0;

        const achieved = implemented * 1.0 + inProgress * 0.5;

        const raw = achieved / totalApplicable;
        return Math.max(0, Math.min(1, Number(raw.toFixed(4))));
    }

    async getReadinessByCategory(): Promise<ReadinessByCategoryDto[]> {
        const grouped = await this.prisma.control.groupBy({
            by: [
                'category',
                'status',
            ],
            _count: { _all: true },
        });

        const byCategory = new Map<string, Record<ControlStatus, number>>();

        for (const row of grouped) {
            const category = row.category ?? 'Uncategorized';
            const status = row.status;
            const count = row._count._all;

            if (!byCategory.has(category)) {
                byCategory.set(category, {
                    NOT_STARTED: 0,
                    IN_PROGRESS: 0,
                    IMPLEMENTED: 0,
                    NOT_APPLICABLE: 0,
                });
            }

            byCategory.get(category)![status] = count;
        }

        const result: ReadinessByCategoryDto[] = [];

        for (const [ category, counts ] of byCategory.entries()) {
            const implemented = counts[ControlStatus.IMPLEMENTED];
            const inProgress = counts[ControlStatus.IN_PROGRESS];
            const notStarted = counts[ControlStatus.NOT_STARTED];
            const notApplicable = counts[ControlStatus.NOT_APPLICABLE];

            const total = implemented + inProgress + notStarted + notApplicable;
            const totalApplicable = implemented + inProgress + notStarted;

            const score = this.computeScore({ implemented, inProgress, notStarted, totalApplicable });

            result.push({
                category,
                score,
                scorePercent: Math.round(score * 100),
                breakdown: {
                    implemented,
                    inProgress,
                    notStarted,
                    notApplicable,
                    total,
                    totalApplicable,
                },
            });
        }

        result.sort((a, b) => {
            if (a.category === 'Uncategorized') return 1;
            if (b.category === 'Uncategorized') return -1;
            return a.category.localeCompare(b.category);
        });

        return result;
    }

    async getAuditForControl(controlId: string) {
        return this.prisma.auditEvent.findMany({
            where: { controlId },
            orderBy: { createdAt: 'desc' },
            take: 100,
            select: {
                id: true,
                action: true,
                entityType: true,
                entityId: true,
                meta: true,
                createdAt: true,
                actorId: true,
                actor: {
                    select: { id: true, email: true, role: true },
                },
            },
        });
    }

}

