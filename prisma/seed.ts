import { NestFactory } from '@nestjs/core';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/prisma/prisma.service';
import { seedAuditEvents } from './seed/audit.seed';
import { seedControls } from './seed/controls.seed';
import { seedControlEvidence } from './seed/evidence.seed';
import { seedRiskControls } from './seed/risk-controls.seed';
import { seedRisks } from './seed/risks.seed';
import { seedUsers } from './seed/users.seed';

async function seed() {
    const app = await NestFactory.createApplicationContext(AppModule);
    const prisma = app.get(PrismaService);

    console.log('Seeding users...');
    await seedUsers(prisma);

    console.log('Seeding controls...');
    await seedControls(prisma);

    console.log('Seeding risks...');
    await seedRisks(prisma);

    console.log('Seeding risk-control mappings...');
    await seedRiskControls(prisma);

    console.log('Seeding control evidence...');
    await seedControlEvidence(prisma);

    console.log('Seeding audit events...');
    await seedAuditEvents(prisma);

    await app.close();
}

seed()
  .then(() => console.log('Seeding done'))
  .catch((error) => {
      console.error('Seeding failed:', error);
      process.exit(1);
  });
