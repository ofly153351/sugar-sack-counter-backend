import { PartialType } from "@nestjs/mapped-types";
import { CreateVehicleDto } from "./create-vehicle.dto";
import {
  IsOptional,
  IsString,
  IsEnum,
  IsUUID,
  IsNumber,
  Min,
  IsArray,
  ValidateNested,
} from "class-validator";
import { ApiPropertyOptional } from "@nestjs/swagger";
import { Type } from "class-transformer";
import { VehicleSackRowInputDto } from "./vehicle-sack-row-input.dto";

export class UpdateVehicleDto extends PartialType(CreateVehicleDto) {
  @ApiPropertyOptional({
    description: "รหัสรถ",
    example: "VH002",
  })
  @IsOptional()
  @IsString()
  vehicleCode?: string;

  @ApiPropertyOptional({
    description: "ป้ายทะเบียนรถ",
    example: "กข5678",
  })
  @IsOptional()
  @IsString()
  licensePlate?: string;

  @ApiPropertyOptional({
    description: "ID ประเภทรถ",
    example: "uuid-string",
  })
  @IsOptional()
  @IsString()
  vehicleTypeId?: string;

  @ApiPropertyOptional({
    description: "น้ำหนักบรรทุกสูงสุด (ตัน)",
    example: 35,
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  maxLoadWeightTon?: number;

  @ApiPropertyOptional({
    description: "ID ของผู้ขับรถ (user ในระบบ)",
    example: "uuid-string",
  })
  @IsOptional()
  @IsUUID()
  driverUserId?: string;

  @ApiPropertyOptional({
    description: "สถานะรถ",
    example: "inactive",
    enum: ["active", "inactive", "maintenance"],
  })
  @IsOptional()
  @IsString()
  @IsEnum(["active", "inactive", "maintenance"])
  status?: string;

  @ApiPropertyOptional({
    description: "config จำนวนกระสอบต่อแถว (replace ทั้งชุด)",
    type: [VehicleSackRowInputDto],
    example: [
      { rowNumber: 1, sackCount: 22 },
      { rowNumber: 2, sackCount: 19 },
    ],
  })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => VehicleSackRowInputDto)
  sackRows?: VehicleSackRowInputDto[];

  @ApiPropertyOptional({
    description: "alias ของ sackRows",
    type: [VehicleSackRowInputDto],
    example: [
      { rowNumber: 1, bagCount: 22 },
      { rowNumber: 2, bagCount: 19 },
    ],
  })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => VehicleSackRowInputDto)
  bagRows?: VehicleSackRowInputDto[];
}
