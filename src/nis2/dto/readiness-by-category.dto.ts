import { ApiProperty } from '@nestjs/swagger';

export class ReadinessCategoryBreakdownDto {
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

export class ReadinessByCategoryDto {
    @ApiProperty({ example: 'Governance' })
    category: string;

    @ApiProperty({ example: 0.62 })
    score: number;

    @ApiProperty({ example: 62 })
    scorePercent: number;

    @ApiProperty({ type: ReadinessCategoryBreakdownDto })
    breakdown: ReadinessCategoryBreakdownDto;
}
