import { Module } from "@nestjs/common";
import { MinioService } from "./minio.service";
import { MinioController } from "./minio.controller";
import { ImagesController } from "./images.controller";

@Module({
  controllers: [MinioController, ImagesController],
  providers: [MinioService],
  exports: [MinioService],
})
export class MinioModule {}
