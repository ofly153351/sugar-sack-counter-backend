import {
  Controller,
  Post,
  Body,
  UseGuards,
  Get,
  Request,
} from "@nestjs/common";
import { AuthService } from "./auth.service";
import { LocalAuthGuard } from "../../common/guards/local-auth.guard";
import { JwtAuthGuard } from "../../common/guards/jwt-auth.guard";
import { LoginDto } from "./dto/login.dto";
import { RegisterDto } from "./dto/register.dto";
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBody,
  ApiBearerAuth,
} from "@nestjs/swagger";

@ApiTags("auth")
@Controller("auth")
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post("register")
  @ApiOperation({
    summary: "สมัครสมาชิกใหม่",
    description: "สร้างบัญชีผู้ใช้งานใหม่ในระบบ",
  })
  @ApiBody({ type: RegisterDto })
  @ApiResponse({
    status: 201,
    description: "สมัครสมาชิกสำเร็จ",
    schema: {
      example: {
        id: "uuid-string",
        email: "user@example.com",
        username: "johndoe",
        firstName: "John",
        lastName: "Doe",
        access_token: "jwt-token-string",
      },
    },
  })
  @ApiResponse({
    status: 400,
    description: "ข้อมูลไม่ถูกต้องหรืออีเมลซ้ำ",
  })
  async register(@Body() registerDto: RegisterDto) {
    return this.authService.register(registerDto);
  }

  @UseGuards(LocalAuthGuard)
  @Post("login")
  @ApiOperation({
    summary: "เข้าสู่ระบบ",
    description: "เข้าสู่ระบบด้วยอีเมลและรหัสผ่าน",
  })
  @ApiBody({ type: LoginDto })
  @ApiResponse({
    status: 200,
    description: "เข้าสู่ระบบสำเร็จ",
    schema: {
      example: {
        id: "uuid-string",
        email: "user@example.com",
        username: "johndoe",
        firstName: "John",
        lastName: "Doe",
        access_token: "jwt-token-string",
      },
    },
  })
  @ApiResponse({
    status: 401,
    description: "อีเมลหรือรหัสผ่านไม่ถูกต้อง",
  })
  async login(@Request() req) {
    return this.authService.login(req.user);
  }

  @UseGuards(JwtAuthGuard)
  @Get("profile")
  @ApiBearerAuth("JWT-auth")
  @ApiOperation({
    summary: "ดูข้อมูลโปรไฟล์",
    description: "ดูข้อมูลโปรไฟล์ของผู้ใช้งานปัจจุบัน",
  })
  @ApiResponse({
    status: 200,
    description: "ดึงข้อมูลโปรไฟล์สำเร็จ",
    schema: {
      example: {
        id: "uuid-string",
        email: "user@example.com",
        username: "johndoe",
        firstName: "John",
        lastName: "Doe",
        role: "user",
      },
    },
  })
  @ApiResponse({
    status: 401,
    description: "ไม่มีสิทธิ์เข้าถึง",
  })
  getProfile(@Request() req) {
    return req.user;
  }

  @UseGuards(JwtAuthGuard)
  @Post("refresh")
  @ApiBearerAuth("JWT-auth")
  @ApiOperation({
    summary: "รีเฟรชโทเคน",
    description: "ขอโทเคนใหม่เมื่อโทเคนเก่าใกล้หมดอายุ",
  })
  @ApiResponse({
    status: 200,
    description: "รีเฟรชโทเคนสำเร็จ",
    schema: {
      example: {
        access_token: "new-jwt-token-string",
      },
    },
  })
  @ApiResponse({
    status: 401,
    description: "โทเคนไม่ถูกต้อง",
  })
  refreshToken(@Request() req) {
    return this.authService.refreshToken(req.user);
  }
}
