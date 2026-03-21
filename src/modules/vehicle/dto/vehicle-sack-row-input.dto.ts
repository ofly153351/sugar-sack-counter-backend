import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { Type } from "class-transformer";
import { IsInt, IsOptional, Min } from "class-validator";

export class VehicleSackRowInputDto {
  @ApiProperty({
    description: "ลำดับแถว เริ่มที่ 1",
    example: 1,
  })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  rowNumber: number;

  @ApiPropertyOptional({
    description: "จำนวนกระสอบของแถวนี้ (alias: bagCount)",
    example: 20,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  sackCount?: number;

  @ApiPropertyOptional({
    description: "alias ของ sackCount",
    example: 20,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  bagCount?: number;
}
