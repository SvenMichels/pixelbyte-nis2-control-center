import { ApiProperty } from '@nestjs/swagger';
import { IncidentStatus } from '@prisma/client';
import { IsEnum, IsNotEmpty } from 'class-validator';

export class UpdateIncidentStatusDto {
    @ApiProperty({ enum: IncidentStatus, description: 'New incident status' })
    @IsNotEmpty()
    @IsEnum(IncidentStatus)
    status!: IncidentStatus;
}

