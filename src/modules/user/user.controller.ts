import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Request,
} from "@nestjs/common";
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBody,
  ApiBearerAuth,
  ApiParam,
} from "@nestjs/swagger";
import { UserService } from "./user.service";
import { CreateUserDto } from "./dto/create-user.dto";
import { UpdateUserDto } from "./dto/update-user.dto";
import { JwtAuthGuard } from "../../common/guards/jwt-auth.guard";

@ApiTags("users")
@Controller("users")
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth("JWT-auth")
  @ApiOperation({
    summary: "สร้างผู้ใช้งานใหม่",
    description: "สร้างผู้ใช้งานใหม่ในระบบ (สำหรับแอดมินเท่านั้น)",
  })
  @ApiBody({ type: CreateUserDto })
  @ApiResponse({
    status: 201,
    description: "สร้างผู้ใช้งานสำเร็จ",
    schema: {
      example: {
        id: "uuid-string",
        email: "user@example.com",
        name: "John Doe",
        role: "user",
        created_at: "2024-01-01T00:00:00.000Z",
      },
    },
  })
  @ApiResponse({
    status: 400,
    description: "ข้อมูลไม่ถูกต้อง",
  })
  @ApiResponse({
    status: 401,
    description: "ไม่มีสิทธิ์เข้าถึง",
  })
  @ApiResponse({
    status: 409,
    description: "อีเมลซ้ำ",
  })
  create(@Body() createUserDto: CreateUserDto) {
    return this.userService.create(createUserDto);
  }

  @Get()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth("JWT-auth")
  @ApiOperation({
    summary: "ดึงข้อมูลผู้ใช้งานทั้งหมด",
    description: "ดึงรายการผู้ใช้งานทั้งหมดในระบบ (สำหรับแอดมินเท่านั้น)",
  })
  @ApiResponse({
    status: 200,
    description: "ดึงข้อมูลสำเร็จ",
    schema: {
      example: [
        {
          id: "uuid-string",
          email: "user1@example.com",
          name: "John Doe",
          role: "user",
          created_at: "2024-01-01T00:00:00.000Z",
        },
        {
          id: "uuid-string-2",
          email: "user2@example.com",
          name: "Jane Smith",
          role: "admin",
          created_at: "2024-01-02T00:00:00.000Z",
        },
      ],
    },
  })
  @ApiResponse({
    status: 401,
    description: "ไม่มีสิทธิ์เข้าถึง",
  })
  findAll() {
    return this.userService.findAll();
  }

  @Get("me")
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth("JWT-auth")
  @ApiOperation({
    summary: "ดึงข้อมูลผู้ใช้งานปัจจุบัน",
    description: "ดึงข้อมูลผู้ใช้งานที่ล็อกอินอยู่ปัจจุบัน",
  })
  @ApiResponse({
    status: 200,
    description: "ดึงข้อมูลสำเร็จ",
    schema: {
      example: {
        id: "uuid-string",
        email: "user@example.com",
        username: "johndoe",
        firstName: "John",
        lastName: "Doe",
        title: "Mr.",
        position: "User",
        phone: "0923322145",
        employeeCode: "EMP001",
        role: "user",
        createdAt: "2024-01-01T00:00:00.000Z",
        updatedAt: "2024-01-01T00:00:00.000Z",
      },
    },
  })
  @ApiResponse({
    status: 401,
    description: "ไม่มีสิทธิ์เข้าถึง",
  })
  getCurrentUser(@Request() req) {
    return this.userService.findOne(req.user.id);
  }

  @Get(":id")
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth("JWT-auth")
  @ApiOperation({
    summary: "ดึงข้อมูลผู้ใช้งานตาม ID",
    description: "ดึงข้อมูลผู้ใช้งานเฉพาะรายตาม ID",
  })
  @ApiParam({
    name: "id",
    description: "ID ของผู้ใช้งาน",
    example: "uuid-string",
  })
  @ApiResponse({
    status: 200,
    description: "ดึงข้อมูลสำเร็จ",
    schema: {
      example: {
        id: "uuid-string",
        email: "user@example.com",
        name: "John Doe",
        role: "user",
        created_at: "2024-01-01T00:00:00.000Z",
      },
    },
  })
  @ApiResponse({
    status: 401,
    description: "ไม่มีสิทธิ์เข้าถึง",
  })
  @ApiResponse({
    status: 404,
    description: "ไม่พบผู้ใช้งาน",
  })
  findOne(@Param("id") id: string) {
    return this.userService.findOne(id);
  }

  @Patch(":id")
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth("JWT-auth")
  @ApiOperation({
    summary: "อัพเดทข้อมูลผู้ใช้งาน",
    description: "อัพเดทข้อมูลผู้ใช้งานตาม ID (ไม่สามารถอัพเดทรหัสผ่านได้)",
  })
  @ApiParam({
    name: "id",
    description: "ID ของผู้ใช้งาน",
    example: "uuid-string",
  })
  @ApiBody({ type: UpdateUserDto })
  @ApiResponse({
    status: 200,
    description: "อัพเดทข้อมูลสำเร็จ",
    schema: {
      example: {
        id: "uuid-string",
        email: "updated@example.com",
        username: "johndoe",
        firstName: "John",
        lastName: "Doe",
        title: "Mr.",
        position: "User",
        phone: "0923322145",
        employeeCode: "EMP001",
        role: "user",
        createdAt: "2024-01-01T00:00:00.000Z",
        updatedAt: "2024-01-02T00:00:00.000Z",
      },
    },
  })
  @ApiResponse({
    status: 400,
    description: "ข้อมูลไม่ถูกต้อง",
  })
  @ApiResponse({
    status: 401,
    description: "ไม่มีสิทธิ์เข้าถึง",
  })
  @ApiResponse({
    status: 404,
    description: "ไม่พบผู้ใช้งาน",
  })
  update(@Param("id") id: string, @Body() updateUserDto: UpdateUserDto) {
    return this.userService.update(id, updateUserDto);
  }

  @Delete(":id")
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth("JWT-auth")
  @ApiOperation({
    summary: "ลบผู้ใช้งาน",
    description: "ลบผู้ใช้งานตาม ID (สำหรับแอดมินเท่านั้น)",
  })
  @ApiParam({
    name: "id",
    description: "ID ของผู้ใช้งาน",
    example: "uuid-string",
  })
  @ApiResponse({
    status: 200,
    description: "ลบผู้ใช้งานสำเร็จ",
    schema: {
      example: {
        message: "ลบผู้ใช้งานสำเร็จ",
      },
    },
  })
  @ApiResponse({
    status: 401,
    description: "ไม่มีสิทธิ์เข้าถึง",
  })
  @ApiResponse({
    status: 404,
    description: "ไม่พบผู้ใช้งาน",
  })
  remove(@Param("id") id: string) {
    return this.userService.remove(id);
  }
}
