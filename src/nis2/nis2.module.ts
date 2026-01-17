import { Module } from '@nestjs/common';
import { ControlsModule } from '../controls/controls.module';
import { Nis2Controller } from './nis2.controller';
import { Nis2Service } from './nis2.service';

@Module({
    imports: [ ControlsModule ],
    controllers: [ Nis2Controller ],
    providers: [ Nis2Service ],
})
export class Nis2Module {
}
