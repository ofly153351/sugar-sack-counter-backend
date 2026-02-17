import { PartialType } from "@nestjs/mapped-types";
import { CreateVehicleTypeDto } from "./create-vehicle-type.dto";
import { IsOptional, IsString } from "class-validator";
import { ApiPropertyOptional } from "@nestjs/swagger";

export class UpdateVehicleTypeDto extends PartialType(CreateVehicleTypeDto) {
  @ApiPropertyOptional({
    description: "ชื่อประเภทรถ",
    example: "รถบรรทุก 12 ล้อ",
  })
  @IsOptional()
  @IsString()
  name?: string;
}
