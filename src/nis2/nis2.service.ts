import { Injectable } from '@nestjs/common';
import { ControlStatus } from '@prisma/client';
import { ControlsService } from '../controls/controls.service';
import { ReadinessResponseDto } from './dto/readiness-response.dto';

@Injectable()
export class Nis2Service {
    constructor(private readonly controls: ControlsService) {
    }

    async getReadiness(): Promise<ReadinessResponseDto> {
        const all = await this.controls.findAllForReadiness();

        const applicable = all.filter(c => c.status !== ControlStatus.NOT_APPLICABLE);

        const counts = {
            implemented: 0,
            inProgress: 0,
            notStarted: 0,
            notApplicable: all.length - applicable.length,
        };

        for (const c of applicable) {
            if (c.status === ControlStatus.IMPLEMENTED) counts.implemented++;
            else if (c.status === ControlStatus.IN_PROGRESS) counts.inProgress++;
            else if (c.status === ControlStatus.NOT_STARTED) counts.notStarted++;
        }

        const totalApplicable = applicable.length;

        const scoreRaw =
          totalApplicable === 0
            ? 0
            : (counts.implemented * 1 + counts.inProgress * 0.5) / totalApplicable;

        return {
            score: Number(scoreRaw.toFixed(2)),
            scorePercent: Math.round(scoreRaw * 100),
            breakdown: {
                implemented: counts.implemented,
                inProgress: counts.inProgress,
                notStarted: counts.notStarted,
                notApplicable: counts.notApplicable,
                total: all.length,
                totalApplicable,
            },
            byStatus: [
                { status: ControlStatus.NOT_APPLICABLE, count: counts.notApplicable },
                { status: ControlStatus.IMPLEMENTED, count: counts.implemented },
                { status: ControlStatus.IN_PROGRESS, count: counts.inProgress },
                { status: ControlStatus.NOT_STARTED, count: counts.notStarted },
            ],
        };
    }
}
