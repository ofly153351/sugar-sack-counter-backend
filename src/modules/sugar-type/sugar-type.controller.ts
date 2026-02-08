import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Query,
} from "@nestjs/common";
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBody,
  ApiBearerAuth,
  ApiParam,
  ApiQuery,
} from "@nestjs/swagger";
import { SugarTypeService } from "./sugar-type.service";
import { CreateSugarTypeDto } from "./dto/create-sugar-type.dto";
import { UpdateSugarTypeDto } from "./dto/update-sugar-type.dto";
import { JwtAuthGuard } from "../../common/guards/jwt-auth.guard";

@ApiTags("sugar-types")
@Controller("sugar-types")
export class SugarTypeController {
  constructor(private readonly sugarTypeService: SugarTypeService) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth("JWT-auth")
  @ApiOperation({
    summary: "สร้างประเภทน้ำตาลใหม่",
    description: "สร้างประเภทน้ำตาลใหม่ในระบบ",
  })
  @ApiBody({ type: CreateSugarTypeDto })
  @ApiResponse({
    status: 201,
    description: "สร้างประเภทน้ำตาลสำเร็จ",
    schema: {
      example: {
        id: "uuid-string",
        name: "น้ำตาลทรายขาว",
        description: "น้ำตาลทรายขาวบริสุทธิ์",
        createdAt: "2024-01-01T00:00:00.000Z",
        updatedAt: "2024-01-01T00:00:00.000Z",
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
    description: "ชื่อประเภทน้ำตาลซ้ำ",
  })
  create(@Body() createSugarTypeDto: CreateSugarTypeDto) {
    return this.sugarTypeService.create(createSugarTypeDto);
  }

  @Get()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth("JWT-auth")
  @ApiOperation({
    summary: "ดึงข้อมูลประเภทน้ำตาลทั้งหมด",
    description: "ดึงรายการประเภทน้ำตาลทั้งหมดในระบบ",
  })
  @ApiQuery({
    name: "search",
    required: false,
    description: "ค้นหาประเภทน้ำตาลตามชื่อหรือคำอธิบาย",
  })
  @ApiResponse({
    status: 200,
    description: "ดึงข้อมูลสำเร็จ",
    schema: {
      example: [
        {
          id: "uuid-string",
          name: "น้ำตาลทรายขาว",
          description: "น้ำตาลทรายขาวบริสุทธิ์",
          createdAt: "2024-01-01T00:00:00.000Z",
          updatedAt: "2024-01-01T00:00:00.000Z",
        },
        {
          id: "uuid-string-2",
          name: "น้ำตาลทรายแดง",
          description: "น้ำตาลทรายแดงไม่ฟอกสี",
          createdAt: "2024-01-02T00:00:00.000Z",
          updatedAt: "2024-01-02T00:00:00.000Z",
        },
      ],
    },
  })
  @ApiResponse({
    status: 401,
    description: "ไม่มีสิทธิ์เข้าถึง",
  })
  findAll(@Query("search") search?: string) {
    if (search) {
      return this.sugarTypeService.searchSugarTypes(search);
    }
    return this.sugarTypeService.findAll();
  }

  @Get("active")
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth("JWT-auth")
  @ApiOperation({
    summary: "ดึงข้อมูลประเภทน้ำตาลที่ใช้งานอยู่",
    description: "ดึงรายการประเภทน้ำตาลที่มีการใช้งานในระบบ",
  })
  @ApiResponse({
    status: 200,
    description: "ดึงข้อมูลสำเร็จ",
    schema: {
      example: [
        {
          id: "uuid-string",
          name: "น้ำตาลทรายขาว",
          description: "น้ำตาลทรายขาวบริสุทธิ์",
          createdAt: "2024-01-01T00:00:00.000Z",
          updatedAt: "2024-01-01T00:00:00.000Z",
        },
      ],
    },
  })
  @ApiResponse({
    status: 401,
    description: "ไม่มีสิทธิ์เข้าถึง",
  })
  findActive() {
    return this.sugarTypeService.getActiveSugarTypes();
  }

  @Get(":id")
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth("JWT-auth")
  @ApiOperation({
    summary: "ดึงข้อมูลประเภทน้ำตาลตาม ID",
    description: "ดึงข้อมูลประเภทน้ำตาลเฉพาะรายตาม ID",
  })
  @ApiParam({
    name: "id",
    description: "ID ของประเภทน้ำตาล",
    example: "uuid-string",
  })
  @ApiResponse({
    status: 200,
    description: "ดึงข้อมูลสำเร็จ",
    schema: {
      example: {
        id: "uuid-string",
        name: "น้ำตาลทรายขาว",
        description: "น้ำตาลทรายขาวบริสุทธิ์",
        createdAt: "2024-01-01T00:00:00.000Z",
        updatedAt: "2024-01-01T00:00:00.000Z",
      },
    },
  })
  @ApiResponse({
    status: 401,
    description: "ไม่มีสิทธิ์เข้าถึง",
  })
  @ApiResponse({
    status: 404,
    description: "ไม่พบประเภทน้ำตาล",
  })
  findOne(@Param("id") id: string) {
    return this.sugarTypeService.findOne(id);
  }

  @Get(":id/sessions")
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth("JWT-auth")
  @ApiOperation({
    summary: "ดึงข้อมูลประเภทน้ำตาลพร้อมเซสชันที่เกี่ยวข้อง",
    description:
      "ดึงข้อมูลประเภทน้ำตาลพร้อมรายการเซสชันการนับทั้งหมดที่ใช้ประเภทนี้",
  })
  @ApiParam({
    name: "id",
    description: "ID ของประเภทน้ำตาล",
    example: "uuid-string",
  })
  @ApiResponse({
    status: 200,
    description: "ดึงข้อมูลสำเร็จ",
    schema: {
      example: {
        id: "uuid-string",
        name: "น้ำตาลทรายขาว",
        description: "น้ำตาลทรายขาวบริสุทธิ์",
        sackSessions: [
          {
            id: "session-uuid",
            countingDate: "2024-01-01T10:00:00.000Z",
            status: "completed",
            vehicle: {
              id: "vehicle-uuid",
              vehicleCode: "VH001",
              licensePlate: "กข1234",
            },
            user: {
              id: "user-uuid",
              username: "johndoe",
              profile: {
                firstName: "John",
                lastName: "Doe",
              },
            },
          },
        ],
        boxSessions: [],
        countingSessions: [],
        createdAt: "2024-01-01T00:00:00.000Z",
        updatedAt: "2024-01-01T00:00:00.000Z",
      },
    },
  })
  @ApiResponse({
    status: 401,
    description: "ไม่มีสิทธิ์เข้าถึง",
  })
  @ApiResponse({
    status: 404,
    description: "ไม่พบประเภทน้ำตาล",
  })
  findOneWithSessions(@Param("id") id: string) {
    return this.sugarTypeService.getSugarTypeWithSessions(id);
  }

  @Patch(":id")
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth("JWT-auth")
  @ApiOperation({
    summary: "อัพเดทข้อมูลประเภทน้ำตาล",
    description: "อัพเดทข้อมูลประเภทน้ำตาลตาม ID",
  })
  @ApiParam({
    name: "id",
    description: "ID ของประเภทน้ำตาล",
    example: "uuid-string",
  })
  @ApiBody({ type: UpdateSugarTypeDto })
  @ApiResponse({
    status: 200,
    description: "อัพเดทข้อมูลสำเร็จ",
    schema: {
      example: {
        id: "uuid-string",
        name: "น้ำตาลทรายขาวพิเศษ",
        description: "น้ำตาลทรายขาวบริสุทธิ์เกรดพรีเมียม",
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
    description: "ไม่พบประเภทน้ำตาล",
  })
  @ApiResponse({
    status: 409,
    description: "ชื่อประเภทน้ำตาลซ้ำ",
  })
  update(
    @Param("id") id: string,
    @Body() updateSugarTypeDto: UpdateSugarTypeDto,
  ) {
    return this.sugarTypeService.update(id, updateSugarTypeDto);
  }

  @Delete(":id")
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth("JWT-auth")
  @ApiOperation({
    summary: "ลบประเภทน้ำตาล",
    description: "ลบประเภทน้ำตาลตาม ID (ไม่สามารถลบประเภทที่มีเซสชันการนับได้)",
  })
  @ApiParam({
    name: "id",
    description: "ID ของประเภทน้ำตาล",
    example: "uuid-string",
  })
  @ApiResponse({
    status: 200,
    description: "ลบประเภทน้ำตาลสำเร็จ",
    schema: {
      example: {
        message: "Sugar type deleted successfully",
      },
    },
  })
  @ApiResponse({
    status: 400,
    description: "ไม่สามารถลบประเภทที่มีเซสชันการนับได้",
  })
  @ApiResponse({
    status: 401,
    description: "ไม่มีสิทธิ์เข้าถึง",
  })
  @ApiResponse({
    status: 404,
    description: "ไม่พบประเภทน้ำตาล",
  })
  remove(@Param("id") id: string) {
    return this.sugarTypeService.remove(id);
  }

  @Get("name/:name")
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth("JWT-auth")
  @ApiOperation({
    summary: "ค้นหาประเภทน้ำตาลตามชื่อ",
    description: "ค้นหาข้อมูลประเภทน้ำตาลตามชื่อ",
  })
  @ApiParam({
    name: "name",
    description: "ชื่อประเภทน้ำตาล",
    example: "น้ำตาลทรายขาว",
  })
  @ApiResponse({
    status: 200,
    description: "ดึงข้อมูลสำเร็จ",
    schema: {
      example: {
        id: "uuid-string",
        name: "น้ำตาลทรายขาว",
        description: "น้ำตาลทรายขาวบริสุทธิ์",
        createdAt: "2024-01-01T00:00:00.000Z",
        updatedAt: "2024-01-01T00:00:00.000Z",
      },
    },
  })
  @ApiResponse({
    status: 401,
    description: "ไม่มีสิทธิ์เข้าถึง",
  })
  @ApiResponse({
    status: 404,
    description: "ไม่พบประเภทน้ำตาล",
  })
  findByName(@Param("name") name: string) {
    return this.sugarTypeService.findByName(name);
  }
}
