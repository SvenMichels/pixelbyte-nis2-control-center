import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Role } from '@prisma/client';
import { IsEmail, IsEnum, IsNotEmpty, IsOptional, IsString, MinLength } from 'class-validator';

export class CreateUserDto {
    @ApiProperty({ example: 'user@pixelbyte.dev' })
    @IsNotEmpty()
    @IsEmail()
    email!: string;

    @ApiProperty({ example: 'secret123' })
    @IsNotEmpty()
    @IsString()
    @MinLength(8)
    password!: string;

    @ApiPropertyOptional({ enum: Role, default: 'USER' })
    @IsOptional()
    @IsEnum(Role)
    role?: Role;
}

