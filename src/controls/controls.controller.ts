import { Body, Controller, Delete, Get, Param, Patch, Post } from '@nestjs/common';
import { ApiOkResponse, ApiTags } from '@nestjs/swagger';
import { Role } from '@prisma/client';
import { Auth } from '../auth/decorators/auth.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { ReadinessByCategoryDto } from '../nis2/dto/readiness-by-category.dto';
import { ReadinessResponseDto } from '../nis2/dto/readiness-response.dto';
import { ControlsService } from './controls.service';
import { CreateControlDto } from './dto/create-control.dto';
import { UpdateControlStatusDto } from './dto/update-control-status.dto';

@ApiTags('controls')
@Controller('controls')
export class ControlsController {
    constructor(private readonly controls: ControlsService) {
    }

    @Get('readiness')
    @Auth(Role.ADMIN, Role.SECURITY, Role.AUDITOR)
    @ApiOkResponse({ type: ReadinessResponseDto })
    getReadiness(): Promise<ReadinessResponseDto> {
        return this.controls.getReadiness();
    }

    @Get('readiness/categories')
    @Auth(Role.ADMIN, Role.SECURITY, Role.AUDITOR)
    @ApiOkResponse({ type: [ ReadinessByCategoryDto ] })
    getReadinessByCategory(): Promise<ReadinessByCategoryDto[]> {
        return this.controls.getReadinessByCategory();
    }

    @Get()
    @Auth(Role.ADMIN, Role.SECURITY, Role.AUDITOR)
    findAll() {
        return this.controls.findAll();
    }

    @Get(':id')
    @Auth(Role.ADMIN, Role.SECURITY, Role.AUDITOR)
    findOne(@Param('id') id: string) {
        return this.controls.findOne(id);
    }

    @Post()
    @Auth(Role.ADMIN)
    create(@Body() dto: CreateControlDto, @CurrentUser() user: any) {
        return this.controls.create(dto, user.id);
    }

    @Patch(':id/status')
    @Auth(Role.ADMIN, Role.SECURITY)
    updateStatus(
      @Param('id') id: string,
      @Body() dto: UpdateControlStatusDto,
      @CurrentUser() user: any,
    ) {
        return this.controls.updateStatus(id, dto.status, user.id);
    }

    @Delete(':id')
    @Auth(Role.ADMIN)
    remove(@Param('id') id: string) {
        return this.controls.remove(id);
    }

    @Get(':id/audit')
    @Auth(Role.ADMIN, Role.SECURITY, Role.AUDITOR)
    getAudit(@Param('id') id: string) {
        return this.controls.getAuditForControl(id);
    }

}