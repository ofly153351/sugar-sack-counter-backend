import { PartialType } from "@nestjs/mapped-types";
import { CreateVehicleDto } from "./create-vehicle.dto";
import { IsOptional, IsString, IsEnum, IsUUID } from "class-validator";
import { ApiPropertyOptional } from "@nestjs/swagger";

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
}
