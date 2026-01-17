import { ApiProperty } from '@nestjs/swagger';
import { ControlStatus } from '@prisma/client';

export class ReadinessByStatusDto {
    @ApiProperty({ enum: ControlStatus, example: ControlStatus.IMPLEMENTED })
    status: ControlStatus;

    @ApiProperty({ example: 5 })
    count: number;
}

export class ReadinessBreakdownDto {
    @ApiProperty({ example: 5 })
    implemented: number;

    @ApiProperty({ example: 3 })
    inProgress: number;

    @ApiProperty({ example: 2 })
    notStarted: number;

    @ApiProperty({ example: 1 })
    notApplicable: number;

    @ApiProperty({ example: 11 })
    total: number;

    @ApiProperty({ example: 10 })
    totalApplicable: number;
}

export class ReadinessResponseDto {
    @ApiProperty({ example: 0.62 })
    score: number;

    @ApiProperty({ example: 62 })
    scorePercent: number;

    @ApiProperty({ type: ReadinessBreakdownDto })
    breakdown: ReadinessBreakdownDto;

    @ApiProperty({ type: [ ReadinessByStatusDto ] })
    byStatus: ReadinessByStatusDto[];
}
