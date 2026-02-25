import {
  IsEmail,
  IsNotEmpty,
  IsString,
  MinLength,
  IsOptional,
  ValidateIf,
} from "class-validator";
import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";

export class CreateUserDto {
  @ApiPropertyOptional({
    description: "email",
    example: "user@example.com",
    required: false,
  })
  @IsOptional()
  @ValidateIf((_, value) => value !== undefined && value !== "")
  @IsEmail()
  email?: string;

  @ApiProperty({
    description: "password",
    example: "password123",
    required: true,
    minLength: 6,
  })
  @IsString()
  @IsNotEmpty()
  @MinLength(6)
  password: string;

  @ApiProperty({
    description: "username",
    example: "johndoe",
    required: true,
  })
  @IsString()
  @IsNotEmpty()
  username: string;

  @ApiPropertyOptional({
    description: "firstName",
    example: "John",
    required: false,
  })
  @IsOptional()
  @IsString()
  firstName?: string;

  @ApiPropertyOptional({
    description: "lastName",
    example: "Doe",
    required: false,
  })
  @IsOptional()
  @IsString()
  lastName?: string;

  @ApiPropertyOptional({
    description: "employeeCode",
    example: "ADM001",
    required: false,
  })
  @IsString()
  @IsOptional()
  employeeCode?: string;

  @ApiPropertyOptional({
    description: "Phone",
    example: "092332214523",
    required: false,
  })
  @IsString()
  @IsOptional()
  phone?: string;

  @ApiPropertyOptional({
    description: "title",
    example: "Mr.",
    required: false,
  })
  @IsString()
  @IsOptional()
  title?: string;
}
