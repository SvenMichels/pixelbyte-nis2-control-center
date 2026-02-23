import { Module } from '@nestjs/common';
import { AuditModule } from '../audit/audit.module';
import { PrismaModule } from '../prisma/prisma.module';
import { RisksController } from './risks.controller';
import { RisksService } from './risks.service';

@Module({
    imports: [
        PrismaModule,
        AuditModule,
    ],
    controllers: [RisksController],
    providers: [RisksService],
    exports: [RisksService],
})
export class RisksModule {}
