import { Controller, Get } from '@nestjs/common';
import { ApiOkResponse, ApiTags } from '@nestjs/swagger';
import { ControlStatus, Role, RiskStatus } from '@prisma/client';
import { Auth } from '../auth/decorators/auth.decorator';
import { PrismaService } from '../prisma/prisma.service';

interface DashboardStats {
    controls: {
        total: number;
        byStatus: Record<ControlStatus, number>;
        withEvidence: number;
        evidenceCoveragePercent: number;
    };
    risks: {
        total: number;
        byStatus: Record<RiskStatus, number>;
        byLevel: {
            critical: number;
            high: number;
            medium: number;
            low: number;
        };
        topRisks: Array<{
            id: string;
            title: string;
            score: number;
            level: string;
            mitigations: number;
        }>;
        withoutMitigations: number;
        criticalWithoutMitigations: number;
    };
    audit: {
        totalEvents: number;
        last24h: number;
    };
}

@ApiTags('dashboard')
@Controller('dashboard')
export class DashboardController {
    constructor(private readonly prisma: PrismaService) {}

    @Get('stats')
    @Auth(Role.ADMIN, Role.SECURITY, Role.AUDITOR, Role.USER)
    @ApiOkResponse({ description: 'Dashboard statistics' })
    async getStats(): Promise<DashboardStats> {
        // Controls Stats
        const controls = await this.prisma.control.findMany({
            include: {
                controlEvidences: {
                    select: { id: true },
                },
            },
        });

        const controlsByStatus = controls.reduce((acc, c) => {
            acc[c.status] = (acc[c.status] || 0) + 1;
            return acc;
        }, {} as Record<ControlStatus, number>);

        const controlsWithEvidence = controls.filter(c => c.controlEvidences.length > 0).length;
        const evidenceCoveragePercent = controls.length > 0
          ? Math.round((controlsWithEvidence / controls.length) * 100)
          : 0;

        // Risks Stats
        const risks = await this.prisma.risk.findMany({
            include: {
                controls: {
                    select: { controlId: true },
                },
            },
        });

        const risksByStatus = risks.reduce((acc, r) => {
            acc[r.status] = (acc[r.status] || 0) + 1;
            return acc;
        }, {} as Record<RiskStatus, number>);

        const risksByLevel = {
            critical: 0,
            high: 0,
            medium: 0,
            low: 0,
        };

        let risksWithoutMitigations = 0;
        let criticalRisksWithoutMitigations = 0;

        risks.forEach(r => {
            const score = r.severity * r.likelihood;
            const level = this.getRiskLevel(score);

            if (score >= 21) risksByLevel.critical++;
            else if (score >= 13) risksByLevel.high++;
            else if (score >= 7) risksByLevel.medium++;
            else risksByLevel.low++;

            // Track risks without mitigations
            if (r.controls.length === 0) {
                risksWithoutMitigations++;
                if (level === 'critical' || level === 'high') {
                    criticalRisksWithoutMitigations++;
                }
            }
        });

        // Top 5 Risks by score
        const topRisks = risks
          .map(r => ({
              id: r.id,
              title: r.title,
              score: r.severity * r.likelihood,
              level: this.getRiskLevel(r.severity * r.likelihood),
              mitigations: r.controls.length,
          }))
          .sort((a, b) => b.score - a.score)
          .slice(0, 5);

        // Audit Stats
        const totalEvents = await this.prisma.auditEvent.count();
        const last24h = await this.prisma.auditEvent.count({
            where: {
                createdAt: {
                    gte: new Date(Date.now() - 24 * 60 * 60 * 1000),
                },
            },
        });

        return {
            controls: {
                total: controls.length,
                byStatus: controlsByStatus,
                withEvidence: controlsWithEvidence,
                evidenceCoveragePercent,
            },
            risks: {
                total: risks.length,
                byStatus: risksByStatus,
                byLevel: risksByLevel,
                topRisks,
                withoutMitigations: risksWithoutMitigations,
                criticalWithoutMitigations: criticalRisksWithoutMitigations,
            },
            audit: {
                totalEvents,
                last24h,
            },
        };
    }

    private getRiskLevel(score: number): string {
        if (score >= 21) return 'critical';
        if (score >= 13) return 'high';
        if (score >= 7) return 'medium';
        return 'low';
    }
}

