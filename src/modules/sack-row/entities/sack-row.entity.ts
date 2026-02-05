import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";

export class SackRow {
  @ApiProperty({
    description: "ID of the sack row",
    example: "uuid-string",
  })
  id: string;

  @ApiProperty({
    description: "ID of the sack counting session",
    example: "uuid-string",
  })
  sessionId: string;

  @ApiProperty({
    description: "Row number in the counting session",
    example: 1,
  })
  rowNumber: number;

  @ApiProperty({
    description: "Type of weight measurement",
    enum: ["50kg", "100kg", "custom"],
    example: "50kg",
  })
  weightType: string;

  @ApiPropertyOptional({
    description: "AI detected count",
    example: 25,
  })
  aiCount?: number;

  @ApiProperty({
    description: "Final confirmed count",
    example: 24,
  })
  finalCount: number;

  @ApiPropertyOptional({
    description: "Path to the original image file",
    example: "uploads/sacks/session-uuid/row-1.jpg",
  })
  originalImagePath?: string;

  @ApiPropertyOptional({
    description: "Path to the annotated image file",
    example: "uploads/sacks/session-uuid/row-1_annotated.jpg",
  })
  annotatedImagePath?: string;

  @ApiProperty({
    description: "Creation timestamp",
    example: "2024-01-01T00:00:00.000Z",
  })
  createdAt: Date;

  @ApiProperty({
    description: "Last update timestamp",
    example: "2024-01-01T00:00:00.000Z",
  })
  updatedAt: Date;

  // Relations
  @ApiPropertyOptional({
    description: "Sack counting session relation",
  })
  session?: any;
}
