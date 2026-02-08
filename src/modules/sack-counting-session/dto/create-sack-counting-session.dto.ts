import { IsString, IsNumber, IsOptional, IsDateString } from "class-validator";
import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";

export class CreateSackCountingSessionDto {
  @ApiProperty({
    description: "ID of the vehicle",
    example: "uuid-string",
  })
  @IsString()
  vehicleId: string;

  @ApiProperty({
    description: "ID of the sugar type",
    example: "uuid-string",
  })
  @IsString()
  sugarTypeId: string;

  @ApiProperty({
    description: "ID of the user",
    example: "uuid-string",
  })
  @IsString()
  userId: string;

  @ApiPropertyOptional({
    description: "ID of the counting session to link with (optional)",
    example: "uuid-string",
  })
  @IsOptional()
  @IsString()
  countingSessionId?: string;

  @ApiPropertyOptional({
    description: "Date and time of counting",
    example: "2024-01-01T10:00:00.000Z",
  })
  @IsOptional()
  @IsDateString()
  countingDate?: string;

  @ApiPropertyOptional({
    description: "Status of the counting session",
    example: "in_progress",
    default: "in_progress",
  })
  @IsOptional()
  @IsString()
  status?: string;
}
