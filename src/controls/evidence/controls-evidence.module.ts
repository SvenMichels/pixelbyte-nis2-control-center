import { Module } from '@nestjs/common';
import { AuditModule } from '../../audit/audit.module';
import { PrismaModule } from '../../prisma/prisma.module';
import { ControlsEvidenceController } from './controls-evidence.controller';
import { ControlsEvidenceService } from './controls-evidence.service';

@Module({
    imports: [
        PrismaModule,
        AuditModule, // ✅ das ist der Fix
    ],
    controllers: [ ControlsEvidenceController ],
    providers: [ ControlsEvidenceService ],
    exports: [ ControlsEvidenceService ],
})
export class ControlsEvidenceModule {
}
