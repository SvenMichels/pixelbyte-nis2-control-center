import { ConflictException, Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Role } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import { UsersService } from '../users/users.service';

@Injectable()
export class AuthService {
    constructor(
      private readonly users: UsersService,
      private readonly jwt: JwtService,
    ) {
    }

    async login(email: string, password: string) {
        const user = await this.users.findAuthUserByEmail(email);
        if (!user) throw new UnauthorizedException('Invalid credentials');

        const ok = await bcrypt.compare(password, user.passwordHash);
        if (!ok) throw new UnauthorizedException('Invalid credentials');

        return this.issueToken(user.id, user.email, user.role as Role);
    }

    async register(email: string, password: string) {
        const existing = await this.users.findAuthUserByEmail(email);
        if (existing) throw new ConflictException('Email already in use');

        const passwordHash = await bcrypt.hash(password, 12);
        const user = await this.users.createUser(email, passwordHash);

        return this.issueToken(user.id, user.email, user.role as Role);
    }

    private async issueToken(sub: string, email: string, role: Role) {
        const payload = { sub, email, role };

        return {
            accessToken: await this.jwt.signAsync(payload),
            user: { id: sub, email, role },
        };
    }
}
