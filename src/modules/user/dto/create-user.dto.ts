import {
  IsEmail,
  IsNotEmpty,
  IsString,
  MinLength,
  IsOptional,
} from "class-validator";
import { ApiProperty } from "@nestjs/swagger";

export class CreateUserDto {
  @ApiProperty({
    description: "email",
    example: "user@example.com",
    required: true,
  })
  @IsEmail()
  @IsNotEmpty()
  email: string;

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

  @ApiProperty({
    description: "firstName",
    example: "John",
    required: true,
  })
  @IsString()
  @IsNotEmpty()
  firstName: string;

  @ApiProperty({
    description: "lastName",
    example: "Doe",
    required: true,
  })
  @IsString()
  @IsNotEmpty()
  lastName: string;

  @ApiProperty({
    description: "roleId",
    example: "user",
    required: false,
  })
  @IsString()
  @IsOptional()
  roleId?: string;

  @ApiProperty({
    description: "employeeCode",
    example: "ADM001",
    required: true,
  })
  @IsString()
  @IsOptional()
  employeeCode?: string;

  @ApiProperty({
    description: "Phone",
    example: "092332214523",
    required: true,
  })
  @IsString()
  @IsOptional()
  phone?: string;

  @ApiProperty({
    description: "title",
    example: "Mr.",
    required: true,
  })
  @IsString()
  @IsOptional()
  title?: string;
}
