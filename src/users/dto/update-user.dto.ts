import { ApiPropertyOptional } from '@nestjs/swagger';
import { Role } from '@prisma/client';
import { IsEmail, IsEnum, IsOptional, IsString, MinLength } from 'class-validator';

export class UpdateUserDto {
    @ApiPropertyOptional({ example: 'new@mail.dev' })
    @IsOptional()
    @IsEmail()
    email?: string;

    @ApiPropertyOptional({ example: 'newSecret123' })
    @IsOptional()
    @IsString()
    @MinLength(8)
    password?: string;

    @ApiPropertyOptional({ enum: Role, example: 'USER' })
    @IsOptional()
    @IsEnum(Role)
    role?: Role;
}
