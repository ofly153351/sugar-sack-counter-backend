import { Module } from '@nestjs/common';
import { BoxRowService } from './box-row.service';
import { BoxRowController } from './box-row.controller';
import { DatabaseModule } from '../../database/database.module';

@Module({
  imports: [DatabaseModule],
  controllers: [BoxRowController],
  providers: [BoxRowService],
  exports: [BoxRowService],
})
export class BoxRowModule {}
