import { Module } from "@nestjs/common";
import { CountingSessionService } from "./counting-session.service";
import { CountingSessionController } from "./counting-session.controller";
import { DatabaseModule } from "../../database/database.module";
import { MinioModule } from "../minio/minio.module";

@Module({
  imports: [DatabaseModule, MinioModule],
  controllers: [CountingSessionController],
  providers: [CountingSessionService],
  exports: [CountingSessionService],
})
export class CountingSessionModule {}
