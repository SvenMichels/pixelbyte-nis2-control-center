import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuditModule } from './audit/audit.module';
import { AuthModule } from './auth/auth.module';
import { CsrfGuard } from './auth/csrf.guard';
import { ControlsModule } from './controls/controls.module';
import { ControlsEvidenceModule } from './controls/evidence/controls-evidence.module';
import { DashboardModule } from './dashboard/dashboard.module';
import { DocsModule } from './docs/docs.module';
import { IncidentsModule } from './incidents/incidents.module';
import { Nis2Module } from './nis2/nis2.module';
import { PrismaModule } from './prisma/prisma.module';
import { ProjectsModule } from './projects/projects.module';
import { ReportsModule } from './reports/reports.module';
import { RisksModule } from './risks/risks.module';
import { UsersModule } from './users/users.module';

@Module({
    imports: [
        ConfigModule.forRoot({
            isGlobal: true,
            envFilePath: '.env',
        }),
        ThrottlerModule.forRoot([
            {
                ttl: 60000,
                limit: parseInt(process.env.THROTTLE_LIMIT ?? '100', 10),
            },
        ]),
        AuthModule,
        UsersModule,
        ProjectsModule,
        ControlsModule,
        RisksModule,
        IncidentsModule,
        ReportsModule,
        PrismaModule,
        DocsModule,
        Nis2Module,
        ControlsEvidenceModule,
        AuditModule,
        DashboardModule,
    ],
    controllers: [ AppController ],
    providers: [
        AppService,
        {
            provide: APP_GUARD,
            useClass: ThrottlerGuard,
        },
        {
            provide: APP_GUARD,
            useClass: CsrfGuard,
        },
    ],
})
export class AppModule {
}
