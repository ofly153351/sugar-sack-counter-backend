import { IsEmail, IsNotEmpty, IsString } from "class-validator";
import { ApiProperty } from "@nestjs/swagger";

export class LoginDto {
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
  password: string;
}
