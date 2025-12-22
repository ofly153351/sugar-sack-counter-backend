import {
  IsString,
  IsEnum,
  IsOptional,
  IsNumber,
  IsDateString,
} from "class-validator";
import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";

export class CreateCountingSessionDto {
  @ApiProperty({
    enum: ["sack", "box"],
    description: "Type of counting session",
  })
  @IsString()
  @IsEnum(["sack", "box"])
  sessionType: string;

  @ApiPropertyOptional({
    description:
      'ID of sack counting session (required only if sessionType is "sack" and linking to existing sack session)',
  })
  @IsString()
  @IsOptional()
  sackSessionId?: string;

  @ApiPropertyOptional({
    description:
      'ID of box counting session (required only if sessionType is "box" and linking to existing box session)',
  })
  @IsString()
  @IsOptional()
  boxSessionId?: string;

  @ApiProperty({ description: "ID of user who created the session" })
  @IsString()
  userId: string;

  @ApiProperty({ description: "ID of vehicle being counted" })
  @IsString()
  vehicleId: string;

  @ApiProperty({ description: "ID of sugar type being counted" })
  @IsString()
  sugarTypeId: string;

  @ApiProperty({
    description: "Total count of items (sacks or boxes)",
    default: 0,
  })
  @IsNumber()
  totalCount: number;

  @ApiPropertyOptional({ description: "Total weight in kilograms" })
  @IsNumber()
  @IsOptional()
  totalWeight?: number;

  @ApiPropertyOptional({
    description: "Date and time of counting",
    default: "current date/time",
  })
  @IsDateString()
  @IsOptional()
  countingDate?: string;

  @ApiPropertyOptional({
    description: "Status of counting session",
    default: "in_progress",
  })
  @IsString()
  @IsOptional()
  status?: string;
}
