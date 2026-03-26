import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IncidentSeverity } from '@prisma/client';
import { IsEnum, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CreateIncidentDto {
    @ApiProperty({ description: 'Incident title' })
    @IsNotEmpty()
    @IsString()
    title!: string;

    @ApiPropertyOptional({ description: 'Incident description' })
    @IsOptional()
    @IsString()
    description?: string;

    @ApiPropertyOptional({ enum: IncidentSeverity, description: 'Severity level', default: 'LOW' })
    @IsOptional()
    @IsEnum(IncidentSeverity)
    severity?: IncidentSeverity;

    @ApiPropertyOptional({ description: 'Owner user ID' })
    @IsOptional()
    @IsString()
    ownerId?: string;
}

