import { IsString, IsEnum, IsOptional, IsNumber, IsDateString } from 'class-validator';

export class CreateCountingSessionDto {
  @IsString()
  @IsEnum(['sack', 'box'])
  sessionType: string;

  @IsString()
  @IsOptional()
  sackSessionId?: string;

  @IsString()
  @IsOptional()
  boxSessionId?: string;

  @IsString()
  userId: string;

  @IsString()
  vehicleId: string;

  @IsString()
  sugarTypeId: string;

  @IsNumber()
  totalCount: number;

  @IsNumber()
  @IsOptional()
  totalWeight?: number;

  @IsDateString()
  @IsOptional()
  countingDate?: string;

  @IsString()
  @IsOptional()
  status?: string;
}
