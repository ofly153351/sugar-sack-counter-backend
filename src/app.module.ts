import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { AppController } from "./app.controller";
import { AppService } from "./app.service";
import { UserModule } from "./modules/user/user.module";
import { AuthModule } from "./modules/auth/auth.module";
import { AdminModule } from "./modules/admin/admin.module";
import { AiDetectorModule } from "./modules/ai-detector/ai-detector.module";
import { CountingSessionModule } from "./modules/counting-session/counting-session.module";
import { DatabaseModule } from "./database/database.module";
import appConfig from "./config/app.config";

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [appConfig],
    }),
    DatabaseModule,
    UserModule,
    AuthModule,
    AdminModule,
    AiDetectorModule,
    CountingSessionModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
