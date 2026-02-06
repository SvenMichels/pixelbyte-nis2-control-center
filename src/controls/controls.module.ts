import { Module } from '@nestjs/common';
import { AuditModule } from '../audit/audit.module';
import { PrismaModule } from '../prisma/prisma.module';
import { ControlsController } from './controls.controller';
import { ControlsService } from './controls.service';

@Module({
    imports: [
        PrismaModule,
        AuditModule,
    ],
    controllers: [ ControlsController ],
    providers: [ ControlsService ],
    exports: [ ControlsService ],
})
export class ControlsModule {
}
