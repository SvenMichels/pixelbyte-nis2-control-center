import { Module } from '@nestjs/common';
import { ControlsController } from './controls.controller';
import { ControlsService } from './controls.service';

// If PrismaService is provided by a PrismaModule in your project,
// import it here, e.g.: `imports: [PrismaModule]`.
@Module({
  // imports: [PrismaModule],
  controllers: [ControlsController],
  providers: [ControlsService],
  exports: [ControlsService],
})
export class ControlsModule {}
