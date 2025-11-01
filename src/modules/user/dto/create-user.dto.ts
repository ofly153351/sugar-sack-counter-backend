import { IsEmail, IsNotEmpty, IsString, MinLength } from "class-validator";
import { ApiProperty } from "@nestjs/swagger";

export class CreateUserDto {
  @ApiProperty({
    description: "อีเมลผู้ใช้งาน",
    example: "user@example.com",
    required: true,
  })
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @ApiProperty({
    description: "รหัสผ่าน",
    example: "password123",
    required: true,
    minLength: 6,
  })
  @IsString()
  @IsNotEmpty()
  @MinLength(6)
  password: string;

  @ApiProperty({
    description: "ชื่อผู้ใช้งาน",
    example: "John Doe",
    required: true,
  })
  @IsString()
  @IsNotEmpty()
  name: string;
}
