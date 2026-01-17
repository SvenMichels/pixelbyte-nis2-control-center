import { Body, Controller, Delete, Get, Param, Post } from '@nestjs/common';
import { ApiOkResponse, ApiTags } from '@nestjs/swagger';
import { Role } from '@prisma/client';
import { Auth } from '../../auth/decorators/auth.decorator';
import { ControlsEvidenceService } from './controls-evidence.service';
import { CreateEvidenceDto } from './dto/create-evidence.dto';

@ApiTags('controls-evidence')
@Controller('controls/:id/evidence')
export class ControlsEvidenceController {
    constructor(private readonly evidence: ControlsEvidenceService) {
    }

    @Post()
    @Auth(Role.ADMIN, Role.SECURITY)
    create(@Param('id') controlId: string, @Body() dto: CreateEvidenceDto) {
        return this.evidence.create(controlId, dto);
    }

    @Get()
    @Auth(Role.ADMIN, Role.SECURITY, Role.AUDITOR)
    @ApiOkResponse({ isArray: true })
    findAll(@Param('id') controlId: string) {
        return this.evidence.findAll(controlId);
    }

    @Delete(':evidenceId')
    @Auth(Role.ADMIN, Role.SECURITY)
    remove(
      @Param('id') controlId: string,
      @Param('evidenceId') evidenceId: string,
    ) {
        return this.evidence.remove(controlId, evidenceId);
    }

    @Delete()
    @Auth(Role.ADMIN, Role.SECURITY)
    removeAll(@Param('id') controlId: string) {
        return this.evidence.removeAll(controlId);
    }
}
