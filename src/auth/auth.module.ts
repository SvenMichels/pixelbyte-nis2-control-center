import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { UsersModule } from '../users/users.module';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { RolesGuard } from './guards/roles.guard';
import { JwtStrategy } from './jwt.strategy';
import { RbacTestController } from './rbac-test.controller';

@Module({
    imports: [
        ConfigModule,
        UsersModule,
        PassportModule.register({ defaultStrategy: 'jwt' }),
        JwtModule.registerAsync({
            imports: [ ConfigModule ],
            inject: [ ConfigService ],
            useFactory: (config: ConfigService) => ({
                secret: config.getOrThrow<string>('JWT_ACCESS_SECRET'),
                signOptions: {
                    expiresIn: parseInt(config.getOrThrow('JWT_ACCESS_EXPIRES_SECONDS'), 10),
                },
            }),
        }),
    ],

    controllers: [
        AuthController,
        RbacTestController,
    ],
    providers: [
        AuthService,
        JwtStrategy,
        RolesGuard,
    ],
    exports: [ JwtModule ],
})
export class AuthModule {
}
