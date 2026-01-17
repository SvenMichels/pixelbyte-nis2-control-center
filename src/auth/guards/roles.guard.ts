import { CanActivate, ExecutionContext, ForbiddenException, Injectable, UnauthorizedException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Role } from '@prisma/client';
import { ROLES_KEY } from '../decorators/roles.decorator';

type ReqUser = { userId: string; email: string; role: Role }

@Injectable()
export class RolesGuard implements CanActivate {
    constructor(private readonly reflector: Reflector) {
    }

    canActivate(ctx: ExecutionContext): boolean {
        const required = this.reflector.getAllAndOverride<Role[]>(ROLES_KEY, [
            ctx.getHandler(),
            ctx.getClass(),
        ]);
        if (!required || required.length === 0) return true;

        const req = ctx.switchToHttp().getRequest();
        const user = req.user as ReqUser | undefined;

        if (!user) throw new UnauthorizedException('Not authenticated');
        if (!user.role) throw new ForbiddenException('Missing role');
        if (!required.includes(user.role)) throw new ForbiddenException('Insufficient role');

        return true;
    }
}
