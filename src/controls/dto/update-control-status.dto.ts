import { ApiProperty } from '@nestjs/swagger';
import { ControlStatus } from '@prisma/client';
import { IsEnum } from 'class-validator';

export class UpdateControlStatusDto {
  @ApiProperty({ enum: ControlStatus, example: ControlStatus.IN_PROGRESS })
  @IsEnum(ControlStatus)
  status: ControlStatus;
}
