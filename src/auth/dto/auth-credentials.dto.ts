import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsString, MinLength } from 'class-validator';

export class AuthCredentialsDto {
    @ApiProperty({ example: 'developer@example.dev' })
    @IsEmail()
    email: string;

    @ApiProperty({ example: 'test1234' })
    @IsString()
    @MinLength(8)
    password: string;
}
