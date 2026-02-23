import { ApiPropertyOptional } from '@nestjs/swagger';
import { ControlStatus } from '@prisma/client';
import { Transform, Type } from 'class-transformer';
import { IsEnum, IsInt, IsOptional, IsString, Max, Min } from 'class-validator';

export class ControlsQueryDto {
    @ApiPropertyOptional({ description: 'Search by code or title' })
    @IsOptional()
    @IsString()
    search?: string;

    @ApiPropertyOptional({ description: 'Filter by category' })
    @IsOptional()
    @IsString()
    category?: string;

    @ApiPropertyOptional({ description: 'Filter by owner email (contains)' })
    @IsOptional()
    @IsString()
    owner?: string;

    @ApiPropertyOptional({ description: 'Filter by status list (comma separated)' })
    @IsOptional()
    @Transform(({ value }) => (typeof value === 'string' ? value.split(',').filter(Boolean) : value))
    @IsEnum(ControlStatus, { each: true })
    status?: ControlStatus[];

    @ApiPropertyOptional({ description: 'Sort key', default: 'code' })
    @IsOptional()
    @IsString()
    sortKey?: 'code' | 'title' | 'status' | 'category';

    @ApiPropertyOptional({ description: 'Sort direction', default: 'asc' })
    @IsOptional()
    @IsString()
    sortDir?: 'asc' | 'desc';

    @ApiPropertyOptional({ description: 'Number of records to take (default 50, max 200)', default: 50 })
    @IsOptional()
    @Type(() => Number)
    @IsInt()
    @Min(1)
    @Max(200)
    take?: number;

    @ApiPropertyOptional({ description: 'Number of records to skip (default 0)', default: 0 })
    @IsOptional()
    @Type(() => Number)
    @IsInt()
    @Min(0)
    skip?: number;

    @ApiPropertyOptional({ description: 'Cursor for pagination (base64 of "code|id")' })
    @IsOptional()
    @IsString()
    cursor?: string;
}
