import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsInt, IsNotEmpty, IsOptional, IsString, Max, Min } from 'class-validator';

export class CreateRiskDto {
    @ApiProperty({ description: 'Risk title' })
    @IsNotEmpty()
    @IsString()
    title!: string;

    @ApiPropertyOptional({ description: 'Risk description' })
    @IsOptional()
    @IsString()
    description?: string;

    @ApiPropertyOptional({ description: 'Severity (1-5)', default: 1, minimum: 1, maximum: 5 })
    @IsOptional()
    @IsInt()
    @Min(1)
    @Max(5)
    severity?: number;

    @ApiPropertyOptional({ description: 'Likelihood (1-5)', default: 1, minimum: 1, maximum: 5 })
    @IsOptional()
    @IsInt()
    @Min(1)
    @Max(5)
    likelihood?: number;

    @ApiPropertyOptional({ description: 'Impact (1-5)', default: 1, minimum: 1, maximum: 5 })
    @IsOptional()
    @IsInt()
    @Min(1)
    @Max(5)
    impact?: number;

    @ApiPropertyOptional({ description: 'Owner user ID' })
    @IsOptional()
    @IsString()
    ownerId?: string;
}

