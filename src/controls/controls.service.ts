import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { ControlStatus, Prisma } from '@prisma/client';
import { ReadinessByCategoryDto } from '../nis2/dto/readiness-by-category.dto';
import { ReadinessBreakdownDto, ReadinessByStatusDto, ReadinessResponseDto } from '../nis2/dto/readiness-response.dto';
import { PrismaService } from '../prisma/prisma.service';
import { CreateControlDto } from './dto/create-control.dto';

@Injectable()
export class ControlsService {
    constructor(private readonly prisma: PrismaService) {
    }

    async create(dto: CreateControlDto) {
        try {
            return await this.prisma.control.create({
                data: {
                    code: dto.code,
                    title: dto.title,
                    description: dto.description ?? null,
                    status: dto.status ?? ControlStatus.NOT_STARTED,
                    ownerId: dto.ownerId ?? null,
                },
            });
        } catch (e) {
            if (
              e instanceof Prisma.PrismaClientKnownRequestError &&
              e.code === 'P2002'
            ) {
                throw new ConflictException('Control code already exists');
            }
            throw e;
        }
    }

    findAll() {
        return this.prisma.control.findMany({
            orderBy: [ { code: 'asc' } ],
            include: {
                owner: {
                    select: { id: true, email: true, role: true },
                },
            },
        });
    }

    async findOne(id: string) {
        const control = await this.prisma.control.findUnique({
            where: { id },
            include: {
                owner: {
                    select: { id: true, email: true, role: true },
                },
            },
        });

        if (!control) throw new NotFoundException('Control not found');
        return control;
    }

    async updateStatus(id: string, status: ControlStatus) {
        await this.findOne(id);

        return this.prisma.control.update({
            where: { id },
            data: { status },
            include: {
                owner: {
                    select: { id: true, email: true, role: true },
                },
            },
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

        // Gewichtung V1:
        // implemented = 1.0
        // inProgress  = 0.5
        // notStarted  = 0.0
        const achieved = implemented * 1.0 + inProgress * 0.5;

        // clamp: sicher ist sicher
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

        // category -> counts map
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

        // Sortierung fürs Frontend: alphabetisch, "Uncategorized" ans Ende
        result.sort((a, b) => {
            if (a.category === 'Uncategorized') return 1;
            if (b.category === 'Uncategorized') return -1;
            return a.category.localeCompare(b.category);
        });

        return result;
    }
}

