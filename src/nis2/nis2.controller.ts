import { Controller, Get } from '@nestjs/common';
import { ApiOkResponse, ApiTags } from '@nestjs/swagger';
import { Role } from '@prisma/client';
import { Auth } from '../auth/decorators/auth.decorator';
import { ReadinessResponseDto } from './dto/readiness-response.dto';
import { Nis2Service } from './nis2.service';

@ApiTags('nis2')
@Controller('nis2')
export class Nis2Controller {
    constructor(private readonly nis2: Nis2Service) {
    }

    @Get('readiness')
    @Auth(Role.ADMIN, Role.SECURITY, Role.AUDITOR)
    @ApiOkResponse({ type: ReadinessResponseDto })
    readiness(): Promise<ReadinessResponseDto> {
        return this.nis2.getReadiness();
    }
}
