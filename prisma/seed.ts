import { NestFactory } from '@nestjs/core';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/prisma/prisma.service';
import { seedControls } from './seed/controls.seed';
import { seedUsers } from './seed/users.seed';

async function seed() {
    const app = await NestFactory.createApplicationContext(AppModule);
    const prisma = app.get(PrismaService);

    console.log('Seeding users...');
    await seedUsers(prisma);

    console.log('Seeding controls...');
    await seedControls(prisma);

    await app.close();
}

seed()
  .then(() => console.log('Seeding done'))
  .catch((error) => {
      console.error('Seeding failed:', error);
      process.exit(1);
  });
