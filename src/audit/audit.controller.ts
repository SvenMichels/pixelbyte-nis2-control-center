import { Controller, Get, Query } from '@nestjs/common';
import { ApiOkResponse, ApiTags } from '@nestjs/swagger';
import { Role } from '@prisma/client';
import { Auth } from '../auth/decorators/auth.decorator';
import { AuditService } from './audit.service';
import { AuditEventsQueryDto } from './dto/audit-events.query.dto';

@ApiTags('audit')
@Controller('audit')
export class AuditController {
    constructor(private readonly auditService: AuditService) {
    }

    @Get('events')
    @Auth(Role.ADMIN, Role.SECURITY, Role.AUDITOR)
    @ApiOkResponse({ description: 'Audit events with filtering + cursor pagination.' })
    findEvents(@Query() query: AuditEventsQueryDto) {
        return this.auditService.findEvents(query);
    }

    @Get('recent')
    @Auth(Role.ADMIN, Role.SECURITY, Role.AUDITOR)
    @ApiOkResponse({ description: 'Recent audit events for dashboard.' })
    getRecentEvents(@Query('take') take?: number, @Query('cursor') cursor?: string) {
        const limit = take && take > 0 && take <= 100 ? take : 25;
        return this.auditService.findEvents({ take: limit, cursor });
    }
}
