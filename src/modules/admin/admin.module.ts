import { Module } from '@nestjs/common';
import { AdminController } from './admin.controller';
import { UserModule } from '../user/user.module';
import { DatabaseModule } from '../../database/database.module';
import { AdminService } from './admin.service';

@Module({
  imports: [UserModule, DatabaseModule],
  controllers: [AdminController],
  providers: [AdminService],
})
export class AdminModule {}
