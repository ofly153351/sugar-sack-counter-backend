import { Module } from '@nestjs/common';
import { AiDetectorController } from './ai-detector.controller';
import { AiDetectorService } from './ai-detector.service';

@Module({
  controllers: [AiDetectorController],
  providers: [AiDetectorService],
  exports: [AiDetectorService],
})
export class AiDetectorModule {}
