import { ConflictException, Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { Role } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import type { StringValue } from 'ms';
import { UsersService } from '../users/users.service';

@Injectable()
export class AuthService {
    constructor(
      private readonly users: UsersService,
      private readonly jwt: JwtService,
      private readonly config: ConfigService,
    ) {}

    async login(email: string, password: string) {
        const user = await this.users.findAuthUserByEmail(email);
        if (!user) throw new UnauthorizedException('Invalid credentials');

        const ok = await bcrypt.compare(password, user.passwordHash);
        if (!ok) throw new UnauthorizedException('Invalid credentials');

        return this.issueTokens(user.id, user.email, user.role as Role);
    }

    async register(email: string, password: string) {
        const existing = await this.users.findAuthUserByEmail(email);
        if (existing) throw new ConflictException('Email already in use');

        const passwordHash = await bcrypt.hash(password, 12);
        const user = await this.users.createUser(email, passwordHash);

        return this.issueTokens(user.id, user.email, user.role as Role);
    }

    async refresh(refreshToken: string) {
        try {
            const payload = await this.jwt.verifyAsync(refreshToken, {
                secret: this.config.getOrThrow<string>('JWT_REFRESH_SECRET'),
            });

            const user = await this.users.findPublicUserById(payload.sub);
            if (!user) throw new UnauthorizedException('User not found');

            return this.issueTokens(user.id, user.email, user.role as Role);
        } catch {
            throw new UnauthorizedException('Invalid refresh token');
        }
    }

    private async issueTokens(sub: string, email: string, role: Role) {
        const payload = { sub, email, role };

        const accessSecret = this.config.getOrThrow<string>('JWT_ACCESS_SECRET');
        const accessExpires = this.config.get('JWT_ACCESS_EXPIRES', '30m') as StringValue;

        const refreshSecret = this.config.getOrThrow<string>('JWT_REFRESH_SECRET');
        const refreshExpires = this.config.get('JWT_REFRESH_EXPIRES', '14d') as StringValue;

        return {
            accessToken: await this.jwt.signAsync(payload, {
                secret: accessSecret,
                expiresIn: accessExpires,
            }),
            refreshToken: await this.jwt.signAsync(payload, {
                secret: refreshSecret,
                expiresIn: refreshExpires,
            }),
            user: { id: sub, email, role },
        };
    }
}
