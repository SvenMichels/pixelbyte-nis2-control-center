import { Controller } from '@nestjs/common';
import { Role } from '@prisma/client';
import { Auth } from '../auth/decorators/auth.decorator';

@Controller('reports')
@Auth(Role.AUDITOR, Role.ADMIN)
export class ReportsController {
}
