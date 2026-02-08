import { IsOptional, IsString, IsEmail } from "class-validator";
import { ApiPropertyOptional } from "@nestjs/swagger";

export class UpdateUserDto {
  @ApiPropertyOptional({
    description: "email",
    example: "user@example.com",
  })
  @IsOptional()
  @IsEmail()
  email?: string;

  @ApiPropertyOptional({
    description: "username",
    example: "johndoe",
  })
  @IsOptional()
  @IsString()
  username?: string;

  @ApiPropertyOptional({
    description: "firstName",
    example: "John",
  })
  @IsOptional()
  @IsString()
  firstName?: string;

  @ApiPropertyOptional({
    description: "lastName",
    example: "Doe",
  })
  @IsOptional()
  @IsString()
  lastName?: string;

  @ApiPropertyOptional({
    description: "employeeCode",
    example: "ADM001",
  })
  @IsOptional()
  @IsString()
  employeeCode?: string;

  @ApiPropertyOptional({
    description: "Phone",
    example: "092332214523",
  })
  @IsOptional()
  @IsString()
  phone?: string;

  @ApiPropertyOptional({
    description: "title",
    example: "Mr.",
  })
  @IsOptional()
  @IsString()
  title?: string;
}
