import { Module } from '@nestjs/common';
import { CountingSessionService } from './counting-session.service';
import { CountingSessionController } from './counting-session.controller';
import { DatabaseModule } from '../../database/database.module';

@Module({
  imports: [DatabaseModule],
  controllers: [CountingSessionController],
  providers: [CountingSessionService],
  exports: [CountingSessionService],
})
export class CountingSessionModule {}
