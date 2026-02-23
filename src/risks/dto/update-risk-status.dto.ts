import { ApiProperty } from '@nestjs/swagger';
import { RiskStatus } from '@prisma/client';
import { IsEnum, IsNotEmpty } from 'class-validator';

export class UpdateRiskStatusDto {
    @ApiProperty({ enum: RiskStatus, description: 'New risk status' })
    @IsNotEmpty()
    @IsEnum(RiskStatus)
    status!: RiskStatus;
}

