import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from '@nestjs/common';
import type { Request } from 'express';

@Injectable()
export class CsrfGuard implements CanActivate {
    canActivate(context: ExecutionContext): boolean {
        const req = context.switchToHttp().getRequest<Request>();

        const method = (req.method || 'GET').toUpperCase();
        if (method === 'GET' || method === 'HEAD' || method === 'OPTIONS') {
            return true;
        }

        const url = req.url || '';
        if (url.includes('/auth/login') ||
            url.includes('/auth/register') ||
            url.includes('/auth/csrf')) {
            return true;
        }

        const cookies = (req as Request & { cookies: Record<string, string> }).cookies;
        const cookieToken = cookies?.csrf_token;
        const headerToken = (req.headers['x-csrf-token'] as string | undefined) ?? undefined;

        if (!cookieToken || !headerToken || cookieToken !== headerToken) {
            throw new ForbiddenException('CSRF validation failed');
        }

        return true;
    }
}

