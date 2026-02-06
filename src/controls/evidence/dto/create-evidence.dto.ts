import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { EvidenceType } from '@prisma/client';
import { IsEnum, IsOptional, IsString, IsUrl, MaxLength } from 'class-validator';

export class CreateEvidenceDto {
    @ApiProperty({ enum: EvidenceType, example: EvidenceType.NOTE })
    @IsEnum(EvidenceType)
    type: EvidenceType;

    @ApiPropertyOptional({ example: 'Policy exists in Confluence under /security/policies/access-control' })
    @IsOptional()
    @IsString()
    @MaxLength(2000)
    note?: string;

    @ApiPropertyOptional()
    @IsOptional()
    @IsString()
    @IsUrl({ require_protocol: true }, { message: 'link must be a valid URL with protocol (https://...)' })
    link?: string;
}
