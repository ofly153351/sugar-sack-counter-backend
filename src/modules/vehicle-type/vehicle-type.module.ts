import { Module } from "@nestjs/common";
import { VehicleTypeService } from "./vehicle-type.service";
import { VehicleTypeController } from "./vehicle-type.controller";
import { DatabaseModule } from "../../database/database.module";

@Module({
  imports: [DatabaseModule],
  controllers: [VehicleTypeController],
  providers: [VehicleTypeService],
  exports: [VehicleTypeService],
})
export class VehicleTypeModule {}
