import { ApiPropertyOptional } from '@nestjs/swagger';
import { AuditEntityType } from '@prisma/client';
import { Type } from 'class-transformer';
import { IsEnum, IsInt, IsOptional, IsString, Max, Min, ValidateIf } from 'class-validator';

export class AuditEventsQueryDto {
    @ApiPropertyOptional({ description: 'Filter by controlId' })
    @IsOptional()
    @IsString()
    controlId?: string;

    @ApiPropertyOptional({ description: 'Filter by riskId' })
    @IsOptional()
    @IsString()
    riskId?: string;

    @ApiPropertyOptional({ enum: AuditEntityType, description: 'Filter by entity type (requires entityId)' })
    @IsOptional()
    @IsEnum(AuditEntityType)
    entityType?: AuditEntityType;

    @ApiPropertyOptional({ description: 'Filter by entity id (requires entityType)' })
    @ValidateIf((o) => o.entityType !== undefined)
    @IsString()
    entityId?: string;

    @ApiPropertyOptional({ description: 'Filter by actor user id' })
    @IsOptional()
    @IsString()
    actorId?: string;

    @ApiPropertyOptional({ description: 'Page size (default 50, max 200)', default: 50 })
    @IsOptional()
    @Type(() => Number)
    @IsInt()
    @Min(1)
    @Max(200)
    limit?: number;

    @ApiPropertyOptional({ description: 'Number of records to take (alias for limit)', default: 50 })
    @IsOptional()
    @Type(() => Number)
    @IsInt()
    @Min(1)
    @Max(200)
    take?: number;

    @ApiPropertyOptional({ description: 'Cursor for pagination (base64url of "createdAt|id")' })
    @IsOptional()
    @IsString()
    cursor?: string;
}
