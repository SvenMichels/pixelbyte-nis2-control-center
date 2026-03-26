import { Body, Controller, Delete, Get, Param, Patch, Post, Put, Query } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { Role } from '@prisma/client';
import { AuditService } from '../audit/audit.service';
import { AuditEventsQueryDto } from '../audit/dto/audit-events.query.dto';
import { Auth } from '../auth/decorators/auth.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { RequestUser } from '../auth/types/request-user';
import { CreateIncidentDto } from './dto/create-incident.dto';
import { IncidentsQueryDto } from './dto/incidents-query.dto';
import { UpdateIncidentDto } from './dto/update-incident.dto';
import { UpdateIncidentStatusDto } from './dto/update-incident-status.dto';
import { IncidentsService } from './incidents.service';

@ApiTags('incidents')
@Controller('incidents')
export class IncidentsController {
    constructor(
        private readonly incidents: IncidentsService,
        private readonly audit: AuditService,
    ) {}

    @Get()
    @Auth(Role.ADMIN, Role.SECURITY, Role.AUDITOR, Role.USER)
    findAll(@Query() query: IncidentsQueryDto) {
        return this.incidents.findAll(query);
    }

    @Get(':id')
    @Auth(Role.ADMIN, Role.SECURITY, Role.AUDITOR, Role.USER)
    findOne(@Param('id') id: string) {
        return this.incidents.findOne(id);
    }

    @Post()
    @Auth(Role.ADMIN, Role.SECURITY)
    create(@Body() dto: CreateIncidentDto, @CurrentUser() user: RequestUser) {
        return this.incidents.create(dto, user.id);
    }

    @Put(':id')
    @Auth(Role.ADMIN, Role.SECURITY)
    update(@Param('id') id: string, @Body() dto: UpdateIncidentDto, @CurrentUser() user: RequestUser) {
        return this.incidents.update(id, dto, user.id);
    }

    @Patch(':id/status')
    @Auth(Role.ADMIN, Role.SECURITY)
    updateStatus(
        @Param('id') id: string,
        @Body() dto: UpdateIncidentStatusDto,
        @CurrentUser() user: RequestUser,
    ) {
        return this.incidents.updateStatus(id, dto.status, user.id);
    }

    @Delete(':id')
    @Auth(Role.ADMIN)
    remove(@Param('id') id: string) {
        return this.incidents.remove(id);
    }

    @Get(':id/audit')
    @Auth(Role.ADMIN, Role.SECURITY, Role.AUDITOR, Role.USER)
    getAudit(@Param('id') id: string, @Query() query: AuditEventsQueryDto) {
        return this.audit.findEvents({ ...query, incidentId: id });
    }

    @Post(':id/controls/:controlId')
    @Auth(Role.ADMIN, Role.SECURITY)
    linkControl(
        @Param('id') incidentId: string,
        @Param('controlId') controlId: string,
        @CurrentUser() user: RequestUser,
    ) {
        return this.incidents.linkControl(incidentId, controlId, user.id);
    }

    @Delete(':id/controls/:controlId')
    @Auth(Role.ADMIN, Role.SECURITY)
    unlinkControl(
        @Param('id') incidentId: string,
        @Param('controlId') controlId: string,
        @CurrentUser() user: RequestUser,
    ) {
        return this.incidents.unlinkControl(incidentId, controlId, user.id);
    }

    @Get(':id/controls')
    @Auth(Role.ADMIN, Role.SECURITY, Role.AUDITOR, Role.USER)
    getLinkedControls(@Param('id') id: string) {
        return this.incidents.getLinkedControls(id);
    }
}

