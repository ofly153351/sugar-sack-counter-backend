import { Module } from "@nestjs/common";
import { SugarTypeService } from "./sugar-type.service";
import { SugarTypeController } from "./sugar-type.controller";
import { DatabaseModule } from "../../database/database.module";

@Module({
  imports: [DatabaseModule],
  controllers: [SugarTypeController],
  providers: [SugarTypeService],
  exports: [SugarTypeService],
})
export class SugarTypeModule {}
