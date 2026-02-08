import { IsString, IsNotEmpty, IsOptional } from "class-validator";
import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";

export class CreateVehicleTypeDto {
  @ApiProperty({
    description: "ชื่อประเภทรถ",
    example: "รถบรรทุก 10 ล้อ",
    required: true,
  })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiPropertyOptional({
    description: "คำอธิบายประเภทรถ",
    example: "รถบรรทุกขนาดใหญ่สำหรับขนส่งน้ำตาล",
  })
  @IsOptional()
  @IsString()
  description?: string;
}
