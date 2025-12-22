import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsUUID,
  IsEnum,
} from "class-validator";
import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";

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
    description: "ชื่อคนขับรถ",
    example: "สมชาย ใจดี",
    required: true,
  })
  @IsString()
  @IsNotEmpty()
  driverName: string;

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
}
