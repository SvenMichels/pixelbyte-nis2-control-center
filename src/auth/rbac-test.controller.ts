import { Controller, Get } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { Role } from '@prisma/client';
import { Auth } from './decorators/auth.decorator';
import { Authenticated } from './decorators/authenticated.decorator';

@ApiTags('rbac-test')
@ApiBearerAuth('bearer')
@Controller('rbac-test')
export class RbacTestController {

    @Get('any')
    @Authenticated()
    any() {
        return { ok: true, scope: 'any-authenticated' };
    }

    @Get('admin')
    @Auth(Role.ADMIN)
    admin() {
        return { ok: true, scope: 'admin' };
    }

    @Get('security')
    @Auth(Role.SECURITY, Role.ADMIN)
    security() {
        return { ok: true, scope: 'security-or-admin' };
    }

    @Get('auditor')
    @Auth(Role.AUDITOR, Role.ADMIN)
    auditor() {
        return { ok: true, scope: 'auditor-or-admin' };
    }
}
