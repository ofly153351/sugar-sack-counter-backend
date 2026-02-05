import { IsNumber, IsOptional, IsString } from "class-validator";
import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";

export class UpdateBoxRowDto {
  @ApiPropertyOptional({
    description: "Row number in the counting session",
    example: 1,
  })
  @IsOptional()
  @IsNumber()
  rowNumber?: number;

  @ApiPropertyOptional({
    description: "AI detected count",
    example: 25,
  })
  @IsOptional()
  @IsNumber()
  aiCount?: number;

  @ApiPropertyOptional({
    description: "Final confirmed count",
    example: 24,
  })
  @IsOptional()
  @IsNumber()
  finalCount?: number;

  @ApiPropertyOptional({
    description: "Path to the original image file",
    example: "uploads/boxes/session-uuid/row-1.jpg",
  })
  @IsOptional()
  @IsString()
  originalImagePath?: string;

  @ApiPropertyOptional({
    description: "Path to the annotated image file",
    example: "uploads/boxes/session-uuid/row-1_annotated.jpg",
  })
  @IsOptional()
  @IsString()
  annotatedImagePath?: string;
}
