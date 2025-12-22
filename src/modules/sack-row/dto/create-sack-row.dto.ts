import { IsString, IsNumber, IsOptional, IsEnum } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateSackRowDto {
  @ApiProperty({
    description: 'ID of the sack counting session',
    example: 'uuid-string',
  })
  @IsString()
  sessionId: string;

  @ApiProperty({
    description: 'Row number in the counting session',
    example: 1,
  })
  @IsNumber()
  rowNumber: number;

  @ApiProperty({
    description: 'Type of weight measurement',
    enum: ['50kg', '100kg', 'custom'],
    example: '50kg',
  })
  @IsString()
  @IsEnum(['50kg', '100kg', 'custom'])
  weightType: string;

  @ApiPropertyOptional({
    description: 'AI detected count (optional)',
    example: 25,
  })
  @IsOptional()
  @IsNumber()
  aiCount?: number;

  @ApiProperty({
    description: 'Final confirmed count',
    example: 24,
  })
  @IsNumber()
  finalCount: number;

  @ApiPropertyOptional({
    description: 'Path to the image file (optional)',
    example: 'uploads/sacks/session-uuid/row-1.jpg',
  })
  @IsOptional()
  @IsString()
  imagePath?: string;
}
