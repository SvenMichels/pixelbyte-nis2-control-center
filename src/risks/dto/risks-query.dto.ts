import { ApiPropertyOptional } from '@nestjs/swagger';
import { RiskStatus } from '@prisma/client';
import { Transform, Type } from 'class-transformer';
import { IsEnum, IsInt, IsOptional, IsString, Max, Min } from 'class-validator';

export class RisksQueryDto {
    @ApiPropertyOptional({ description: 'Search by title or description' })
    @IsOptional()
    @IsString()
    search?: string;

    @ApiPropertyOptional({ description: 'Filter by status' })
    @IsOptional()
    @IsEnum(RiskStatus)
    status?: RiskStatus;

    @ApiPropertyOptional({ description: 'Filter by owner email (contains)' })
    @IsOptional()
    @IsString()
    owner?: string;

    @ApiPropertyOptional({ description: 'Filter by risk level (low|medium|high|critical)' })
    @IsOptional()
    @IsString()
    level?: 'low' | 'medium' | 'high' | 'critical';

    @ApiPropertyOptional({ description: 'Score min (severity * likelihood)' })
    @IsOptional()
    @Type(() => Number)
    @IsInt()
    @Min(0)
    @Max(25)
    minScore?: number;

    @ApiPropertyOptional({ description: 'Score max (severity * likelihood)' })
    @IsOptional()
    @Type(() => Number)
    @IsInt()
    @Min(0)
    @Max(25)
    maxScore?: number;

    @ApiPropertyOptional({ description: 'Sort key', default: 'score' })
    @IsOptional()
    @IsString()
    sortKey?: 'score' | 'title' | 'status';

    @ApiPropertyOptional({ description: 'Sort direction', default: 'desc' })
    @IsOptional()
    @IsString()
    sortDir?: 'asc' | 'desc';

    @ApiPropertyOptional({ description: 'Number of records to take (optional)' })
    @IsOptional()
    @Type(() => Number)
    @IsInt()
    @Min(1)
    @Max(200)
    take?: number;

    @ApiPropertyOptional({ description: 'Number of records to skip (optional)' })
    @IsOptional()
    @Type(() => Number)
    @IsInt()
    @Min(0)
    skip?: number;
}

