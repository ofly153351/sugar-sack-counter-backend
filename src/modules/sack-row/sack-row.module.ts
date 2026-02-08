import { Module } from '@nestjs/common';
import { SackRowService } from './sack-row.service';
import { SackRowController } from './sack-row.controller';
import { DatabaseModule } from '../../database/database.module';

@Module({
  imports: [DatabaseModule],
  controllers: [SackRowController],
  providers: [SackRowService],
  exports: [SackRowService],
})
export class SackRowModule {}
