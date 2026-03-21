import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsUUID,
  IsEnum,
  IsNumber,
  Min,
  IsArray,
  ValidateNested,
} from "class-validator";
import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { Type } from "class-transformer";
import { VehicleSackRowInputDto } from "./vehicle-sack-row-input.dto";

export class CreateVehicleDto {
  @ApiProperty({
    description: "รหัสรถ",
    example: "VH001",
    required: true,
  })
  @IsString()
  @IsNotEmpty()
  vehicleCode: string;

  @ApiProperty({
    description: "ป้ายทะเบียนรถ",
    example: "กข1234",
    required: true,
  })
  @IsString()
  @IsNotEmpty()
  licensePlate: string;

  @ApiProperty({
    description: "ID ประเภทรถ",
    example: "uuid-string",
    required: true,
  })
  @IsUUID()
  @IsNotEmpty()
  vehicleTypeId: string;

  @ApiProperty({
    description: "น้ำหนักบรรทุกสูงสุด (ตัน)",
    example: 30,
    required: true,
  })
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  maxLoadWeightTon: number;

  @ApiProperty({
    description: "ID ของผู้ขับรถ (user ในระบบ)",
    example: "uuid-string",
    required: true,
  })
  @IsUUID()
  @IsNotEmpty()
  driverUserId: string;

  @ApiPropertyOptional({
    description: "สถานะรถ",
    example: "active",
    enum: ["active", "inactive", "maintenance"],
    default: "active",
  })
  @IsOptional()
  @IsString()
  @IsEnum(["active", "inactive", "maintenance"])
  status?: string;

  @ApiPropertyOptional({
    description: "config จำนวนกระสอบต่อแถว",
    type: [VehicleSackRowInputDto],
    example: [
      { rowNumber: 1, sackCount: 20 },
      { rowNumber: 2, sackCount: 18 },
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
      { rowNumber: 1, bagCount: 20 },
      { rowNumber: 2, bagCount: 18 },
    ],
  })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => VehicleSackRowInputDto)
  bagRows?: VehicleSackRowInputDto[];
}
