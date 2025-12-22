import { PartialType } from "@nestjs/mapped-types";
import { CreateSugarTypeDto } from "./create-sugar-type.dto";
import { IsOptional, IsString } from "class-validator";
import { ApiPropertyOptional } from "@nestjs/swagger";

export class UpdateSugarTypeDto extends PartialType(CreateSugarTypeDto) {
  @ApiPropertyOptional({
    description: "ชื่อประเภทน้ำตาล",
    example: "น้ำตาลทรายขาวพิเศษ",
  })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional({
    description: "คำอธิบายประเภทน้ำตาล",
    example: "น้ำตาลทรายขาวบริสุทธิ์เกรดพรีเมียม",
  })
  @IsOptional()
  @IsString()
  description?: string;
}
