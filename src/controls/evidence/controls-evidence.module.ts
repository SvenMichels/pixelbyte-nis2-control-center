import { Module } from '@nestjs/common';
import { ControlsEvidenceController } from './controls-evidence.controller';
import { ControlsEvidenceService } from './controls-evidence.service';

@Module({
    controllers: [ ControlsEvidenceController ],
    providers: [ ControlsEvidenceService ],
})
export class ControlsEvidenceModule {
}
