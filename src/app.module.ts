import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { AppController } from "./app.controller";
import { AppService } from "./app.service";
import { UserModule } from "./modules/user/user.module";
import { AuthModule } from "./modules/auth/auth.module";
import { AdminModule } from "./modules/admin/admin.module";
import { AiDetectorModule } from "./modules/ai-detector/ai-detector.module";
import { CountingSessionModule } from "./modules/counting-session/counting-session.module";
import { VehicleModule } from "./modules/vehicle/vehicle.module";
import { VehicleTypeModule } from "./modules/vehicle-type/vehicle-type.module";
import { SugarTypeModule } from "./modules/sugar-type/sugar-type.module";
import { SackRowModule } from "./modules/sack-row/sack-row.module";
import { BoxRowModule } from "./modules/box-row/box-row.module";
import { DatabaseModule } from "./database/database.module";
import { MinioModule } from "./modules/minio/minio.module";
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
    VehicleModule,
    VehicleTypeModule,
    SugarTypeModule,
    SackRowModule,
    BoxRowModule,
    MinioModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
