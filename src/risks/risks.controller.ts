import { Body, Controller, Delete, Get, Param, Patch, Post, Put, Query } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { Role } from '@prisma/client';
import { AuditService } from '../audit/audit.service';
import { AuditEventsQueryDto } from '../audit/dto/audit-events.query.dto';
import { Auth } from '../auth/decorators/auth.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { RequestUser } from '../auth/types/request-user';
import { CreateRiskDto } from './dto/create-risk.dto';
import { UpdateRiskStatusDto } from './dto/update-risk-status.dto';
import { UpdateRiskDto } from './dto/update-risk.dto';
import { RisksQueryDto } from './dto/risks-query.dto';
import { RisksService } from './risks.service';

@ApiTags('risks')
@Controller('risks')
export class RisksController {
    constructor(
        private readonly risks: RisksService,
        private readonly audit: AuditService,
    ) {}

    @Get()
    @Auth(Role.ADMIN, Role.SECURITY, Role.AUDITOR)
    findAll(@Query() query: RisksQueryDto) {
        return this.risks.findAll(query);
    }

    @Get(':id')
    @Auth(Role.ADMIN, Role.SECURITY, Role.AUDITOR)
    findOne(@Param('id') id: string) {
        return this.risks.findOne(id);
    }

    @Post()
    @Auth(Role.ADMIN, Role.SECURITY)
    create(@Body() dto: CreateRiskDto, @CurrentUser() user: RequestUser) {
        return this.risks.create(dto, user.id);
    }

    @Put(':id')
    @Auth(Role.ADMIN, Role.SECURITY)
    update(@Param('id') id: string, @Body() dto: UpdateRiskDto, @CurrentUser() user: RequestUser) {
        return this.risks.update(id, dto, user.id);
    }

    @Patch(':id/status')
    @Auth(Role.ADMIN, Role.SECURITY)
    updateStatus(
        @Param('id') id: string,
        @Body() dto: UpdateRiskStatusDto,
        @CurrentUser() user: RequestUser,
    ) {
        return this.risks.updateStatus(id, dto.status, user.id);
    }

    @Delete(':id')
    @Auth(Role.ADMIN)
    remove(@Param('id') id: string) {
        return this.risks.remove(id);
    }

    @Get(':id/audit')
    @Auth(Role.ADMIN, Role.SECURITY, Role.AUDITOR)
    getAudit(@Param('id') id: string, @Query() query: AuditEventsQueryDto) {
        return this.audit.findEvents({ ...query, riskId: id });
    }

    @Post(':id/controls/:controlId')
    @Auth(Role.ADMIN, Role.SECURITY)
    linkControl(
        @Param('id') riskId: string,
        @Param('controlId') controlId: string,
        @CurrentUser() user: RequestUser,
    ) {
        return this.risks.linkControl(riskId, controlId, user.id);
    }

    @Delete(':id/controls/:controlId')
    @Auth(Role.ADMIN, Role.SECURITY)
    unlinkControl(
        @Param('id') riskId: string,
        @Param('controlId') controlId: string,
        @CurrentUser() user: RequestUser,
    ) {
        return this.risks.unlinkControl(riskId, controlId, user.id);
    }

    @Get(':id/controls')
    @Auth(Role.ADMIN, Role.SECURITY, Role.AUDITOR)
    getLinkedControls(@Param('id') id: string) {
        return this.risks.getLinkedControls(id);
    }
}
