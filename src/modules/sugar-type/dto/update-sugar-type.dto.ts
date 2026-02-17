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
    description: "รหัสสินค้า",
    example: "SKU-SUGAR-001-PREMIUM",
  })
  @IsOptional()
  @IsString()
  productCode?: string;
}
