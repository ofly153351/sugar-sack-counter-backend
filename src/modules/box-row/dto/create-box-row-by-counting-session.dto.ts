import { IsString, IsNumber, IsOptional } from "class-validator";
import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";

export class CreateBoxRowByCountingSessionDto {
  @ApiProperty({
    description: "ID of the counting session",
    example: "uuid-string",
  })
  @IsString()
  countingSessionId: string;

  @ApiProperty({
    description: "Row number in the counting session",
    example: 1,
  })
  @IsNumber()
  rowNumber: number;

  @ApiPropertyOptional({
    description: "AI detected count (optional)",
    example: 25,
  })
  @IsOptional()
  @IsNumber()
  aiCount?: number;

  @ApiProperty({
    description: "Final confirmed count",
    example: 24,
  })
  @IsNumber()
  finalCount: number;

  @ApiPropertyOptional({
    description: "Path to the original image file (optional)",
    example: "uploads/boxes/session-uuid/row-1.jpg",
  })
  @IsOptional()
  @IsString()
  originalImagePath?: string;

  @ApiPropertyOptional({
    description: "Path to the annotated image file (optional)",
    example: "uploads/boxes/session-uuid/row-1_annotated.jpg",
  })
  @IsOptional()
  @IsString()
  annotatedImagePath?: string;
}
