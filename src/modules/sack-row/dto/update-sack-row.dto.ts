import { PartialType } from '@nestjs/mapped-types';
import { CreateSackRowDto } from './create-sack-row.dto';
import { IsOptional, IsNumber, IsString, IsEnum } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateSackRowDto extends PartialType(CreateSackRowDto) {
  @ApiPropertyOptional({
    description: 'Row number in the counting session',
    example: 1,
  })
  @IsOptional()
  @IsNumber()
  rowNumber?: number;

  @ApiPropertyOptional({
    description: 'Type of weight measurement',
    enum: ['50kg', '100kg', 'custom'],
    example: '50kg',
  })
  @IsOptional()
  @IsString()
  @IsEnum(['50kg', '100kg', 'custom'])
  weightType?: string;

  @ApiPropertyOptional({
    description: 'AI detected count',
    example: 25,
  })
  @IsOptional()
  @IsNumber()
  aiCount?: number;

  @ApiPropertyOptional({
    description: 'Final confirmed count',
    example: 24,
  })
  @IsOptional()
  @IsNumber()
  finalCount?: number;

  @ApiPropertyOptional({
    description: 'Path to the image file',
    example: 'uploads/sacks/session-uuid/row-1.jpg',
  })
  @IsOptional()
  @IsString()
  imagePath?: string;
}
