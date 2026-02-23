import { Body, Controller, Get, Post, Req, Res, UnauthorizedException, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { randomBytes } from 'crypto';
import type { Request, Response } from 'express';
import { AuthService } from './auth.service';
import { AuthCredentialsDto } from './dto/auth-credentials.dto';
import { JwtAuthGuard } from './jwt-auth.guard';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
    constructor(private readonly auth: AuthService) {}

    @Post('register')
    register(@Body() body: AuthCredentialsDto) {
        return this.auth.register(body.email, body.password);
    }

    @Post('login')
    async login(
      @Body() body: AuthCredentialsDto,
      @Res({ passthrough: true }) res: Response,
    ) {
        const result = await this.auth.login(body.email, body.password);
        const isProduction = process.env.NODE_ENV === 'production';

        const cookieOptions = {
            httpOnly: true,
            sameSite: 'lax' as const,
            secure: isProduction,
            path: '/',
        };

        res.cookie('access_token', result.accessToken, {
            ...cookieOptions,
            maxAge: 1000 * 60 * 30,
        });

        res.cookie('refresh_token', result.refreshToken, {
            ...cookieOptions,
            maxAge: 1000 * 60 * 60 * 24 * 14,
        });

        res.cookie('csrf_token', randomBytes(32).toString('hex'), {
            httpOnly: false,
            sameSite: 'lax' as const,
            secure: isProduction,
            path: '/',
            maxAge: 1000 * 60 * 60,
        });

        return { ok: true };
    }

    @Post('logout')
    logout(@Res({ passthrough: true }) res: Response) {
        res.clearCookie('access_token', { path: '/' });
        res.clearCookie('refresh_token', { path: '/' });
        res.clearCookie('csrf_token', { path: '/' });
        return { ok: true };
    }

    @Post('refresh')
    async refresh(
      @Req() req: Request,
      @Res({ passthrough: true }) res: Response,
    ) {
        const cookies = (req as Request & { cookies: Record<string, string> }).cookies;
        const refreshToken = cookies?.refresh_token;
        if (!refreshToken) {
            throw new UnauthorizedException('No refresh token');
        }

        const result = await this.auth.refresh(refreshToken);
        const isProduction = process.env.NODE_ENV === 'production';

        res.cookie('access_token', result.accessToken, {
            httpOnly: true,
            sameSite: 'lax',
            secure: isProduction,
            path: '/',
            maxAge: 1000 * 60 * 30,
        });

        res.cookie('refresh_token', result.refreshToken, {
            httpOnly: true,
            sameSite: 'lax',
            secure: isProduction,
            path: '/',
            maxAge: 1000 * 60 * 60 * 24 * 14,
        });

        return { ok: true };
    }

    @Get('csrf')
    csrf(@Res({ passthrough: true }) res: Response) {
        res.cookie('csrf_token', randomBytes(32).toString('hex'), {
            httpOnly: false,
            sameSite: 'lax',
            secure: process.env.NODE_ENV === 'production',
            path: '/',
            maxAge: 1000 * 60 * 60,
        });

        return { ok: true };
    }

    @Get('me')
    @UseGuards(JwtAuthGuard)
    @ApiBearerAuth('bearer')
    getMe(@Req() req: Request) {
        return req.user;
    }
}
