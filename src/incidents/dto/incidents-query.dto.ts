import { ApiPropertyOptional } from '@nestjs/swagger';
import { IncidentSeverity, IncidentStatus } from '@prisma/client';
import { Type } from 'class-transformer';
import { IsEnum, IsInt, IsOptional, IsString, Max, Min } from 'class-validator';

export class IncidentsQueryDto {
    @ApiPropertyOptional({ description: 'Search by title or description' })
    @IsOptional()
    @IsString()
    search?: string;

    @ApiPropertyOptional({ enum: IncidentStatus, description: 'Filter by status' })
    @IsOptional()
    @IsEnum(IncidentStatus)
    status?: IncidentStatus;

    @ApiPropertyOptional({ enum: IncidentSeverity, description: 'Filter by severity' })
    @IsOptional()
    @IsEnum(IncidentSeverity)
    severity?: IncidentSeverity;

    @ApiPropertyOptional({ description: 'Filter by owner email (contains)' })
    @IsOptional()
    @IsString()
    owner?: string;

    @ApiPropertyOptional({ description: 'Sort key', default: 'createdAt' })
    @IsOptional()
    @IsString()
    sortKey?: 'createdAt' | 'title' | 'status' | 'severity';

    @ApiPropertyOptional({ description: 'Sort direction', default: 'desc' })
    @IsOptional()
    @IsString()
    sortDir?: 'asc' | 'desc';

    @ApiPropertyOptional({ description: 'Number of records to take' })
    @IsOptional()
    @Type(() => Number)
    @IsInt()
    @Min(1)
    @Max(200)
    take?: number;

    @ApiPropertyOptional({ description: 'Number of records to skip' })
    @IsOptional()
    @Type(() => Number)
    @IsInt()
    @Min(0)
    skip?: number;
}

