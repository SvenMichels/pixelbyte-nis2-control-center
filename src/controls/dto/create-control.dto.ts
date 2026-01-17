import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ControlStatus } from '@prisma/client';
import { IsEnum, IsOptional, IsString, IsUUID, MinLength } from 'class-validator';

export class CreateControlDto {
  @ApiProperty({ example: 'NIS-ORG-01' })
  @IsString()
  @MinLength(3)
  code: string;

  @ApiProperty({ example: 'Security policies defined' })
  @IsString()
  @MinLength(3)
  title: string;

  @ApiPropertyOptional({
    example: 'Define, approve and publish security policies for the organisation',
  })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({
    enum: ControlStatus,
    example: ControlStatus.NOT_STARTED,
    description: 'If omitted, defaults to NOT_STARTED.',
  })
  @IsOptional()
  @IsEnum(ControlStatus)
  status?: ControlStatus;

  @ApiPropertyOptional({
    example: '8d4c9b3a-0a5e-4e8b-9f2e-2b4f6f2d4d11',
    description: 'Optional owner user id (UUID).',
  })
  @IsOptional()
  @IsUUID()
  ownerId?: string;
}
