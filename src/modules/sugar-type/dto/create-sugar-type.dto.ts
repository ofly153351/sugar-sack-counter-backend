import { IsString, IsNotEmpty, IsOptional } from "class-validator";
import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";

export class CreateSugarTypeDto {
  @ApiProperty({
    description: "ชื่อประเภทน้ำตาล",
    example: "น้ำตาลทรายขาว",
    required: true,
  })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiPropertyOptional({
    description: "คำอธิบายประเภทน้ำตาล",
    example: "น้ำตาลทรายขาวบริสุทธิ์",
  })
  @IsOptional()
  @IsString()
  description?: string;
}
