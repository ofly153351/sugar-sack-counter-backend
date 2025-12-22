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
import { VehicleTypeService } from "./vehicle-type.service";
import { CreateVehicleTypeDto } from "./dto/create-vehicle-type.dto";
import { UpdateVehicleTypeDto } from "./dto/update-vehicle-type.dto";
import { JwtAuthGuard } from "../../common/guards/jwt-auth.guard";

@ApiTags("vehicle-types")
@Controller("vehicle-types")
export class VehicleTypeController {
  constructor(private readonly vehicleTypeService: VehicleTypeService) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth("JWT-auth")
  @ApiOperation({
    summary: "สร้างประเภทรถใหม่",
    description: "สร้างประเภทรถใหม่ในระบบ",
  })
  @ApiBody({ type: CreateVehicleTypeDto })
  @ApiResponse({
    status: 201,
    description: "สร้างประเภทรถสำเร็จ",
    schema: {
      example: {
        id: "uuid-string",
        name: "รถบรรทุก 10 ล้อ",
        description: "รถบรรทุกขนาดใหญ่สำหรับขนส่งน้ำตาล",
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
    description: "ชื่อประเภทรถซ้ำ",
  })
  create(@Body() createVehicleTypeDto: CreateVehicleTypeDto) {
    return this.vehicleTypeService.create(createVehicleTypeDto);
  }

  @Get()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth("JWT-auth")
  @ApiOperation({
    summary: "ดึงข้อมูลประเภทรถทั้งหมด",
    description: "ดึงรายการประเภทรถทั้งหมดในระบบ",
  })
  @ApiQuery({
    name: "search",
    required: false,
    description: "ค้นหาประเภทรถตามชื่อหรือคำอธิบาย",
  })
  @ApiResponse({
    status: 200,
    description: "ดึงข้อมูลสำเร็จ",
    schema: {
      example: [
        {
          id: "uuid-string",
          name: "รถบรรทุก 10 ล้อ",
          description: "รถบรรทุกขนาดใหญ่สำหรับขนส่งน้ำตาล",
          createdAt: "2024-01-01T00:00:00.000Z",
          updatedAt: "2024-01-01T00:00:00.000Z",
        },
        {
          id: "uuid-string-2",
          name: "รถบรรทุก 6 ล้อ",
          description: "รถบรรทุกขนาดกลาง",
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
      return this.vehicleTypeService.searchVehicleTypes(search);
    }
    return this.vehicleTypeService.findAll();
  }

  @Get(":id")
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth("JWT-auth")
  @ApiOperation({
    summary: "ดึงข้อมูลประเภทรถตาม ID",
    description: "ดึงข้อมูลประเภทรถเฉพาะรายตาม ID",
  })
  @ApiParam({
    name: "id",
    description: "ID ของประเภทรถ",
    example: "uuid-string",
  })
  @ApiResponse({
    status: 200,
    description: "ดึงข้อมูลสำเร็จ",
    schema: {
      example: {
        id: "uuid-string",
        name: "รถบรรทุก 10 ล้อ",
        description: "รถบรรทุกขนาดใหญ่สำหรับขนส่งน้ำตาล",
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
    description: "ไม่พบประเภทรถ",
  })
  findOne(@Param("id") id: string) {
    return this.vehicleTypeService.findOne(id);
  }

  @Get(":id/vehicles")
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth("JWT-auth")
  @ApiOperation({
    summary: "ดึงข้อมูลประเภทรถพร้อมรถที่เกี่ยวข้อง",
    description: "ดึงข้อมูลประเภทรถพร้อมรายการรถทั้งหมดที่อยู่ในประเภทนี้",
  })
  @ApiParam({
    name: "id",
    description: "ID ของประเภทรถ",
    example: "uuid-string",
  })
  @ApiResponse({
    status: 200,
    description: "ดึงข้อมูลสำเร็จ",
    schema: {
      example: {
        id: "uuid-string",
        name: "รถบรรทุก 10 ล้อ",
        description: "รถบรรทุกขนาดใหญ่สำหรับขนส่งน้ำตาล",
        vehicles: [
          {
            id: "vehicle-uuid",
            vehicleCode: "VH001",
            licensePlate: "กข1234",
            driverName: "สมชาย ใจดี",
            status: "active",
          },
        ],
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
    description: "ไม่พบประเภทรถ",
  })
  findOneWithVehicles(@Param("id") id: string) {
    return this.vehicleTypeService.getVehicleTypeWithVehicles(id);
  }

  @Patch(":id")
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth("JWT-auth")
  @ApiOperation({
    summary: "อัพเดทข้อมูลประเภทรถ",
    description: "อัพเดทข้อมูลประเภทรถตาม ID",
  })
  @ApiParam({
    name: "id",
    description: "ID ของประเภทรถ",
    example: "uuid-string",
  })
  @ApiBody({ type: UpdateVehicleTypeDto })
  @ApiResponse({
    status: 200,
    description: "อัพเดทข้อมูลสำเร็จ",
    schema: {
      example: {
        id: "uuid-string",
        name: "รถบรรทุก 12 ล้อ",
        description: "รถบรรทุกขนาดใหญ่พิเศษสำหรับขนส่งน้ำตาล",
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
    description: "ไม่พบประเภทรถ",
  })
  @ApiResponse({
    status: 409,
    description: "ชื่อประเภทรถซ้ำ",
  })
  update(
    @Param("id") id: string,
    @Body() updateVehicleTypeDto: UpdateVehicleTypeDto,
  ) {
    return this.vehicleTypeService.update(id, updateVehicleTypeDto);
  }

  @Delete(":id")
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth("JWT-auth")
  @ApiOperation({
    summary: "ลบประเภทรถ",
    description: "ลบประเภทรถตาม ID (ไม่สามารถลบประเภทที่มีรถใช้งานอยู่ได้)",
  })
  @ApiParam({
    name: "id",
    description: "ID ของประเภทรถ",
    example: "uuid-string",
  })
  @ApiResponse({
    status: 200,
    description: "ลบประเภทรถสำเร็จ",
    schema: {
      example: {
        message: "Vehicle type deleted successfully",
      },
    },
  })
  @ApiResponse({
    status: 400,
    description: "ไม่สามารถลบประเภทที่มีรถใช้งานอยู่ได้",
  })
  @ApiResponse({
    status: 401,
    description: "ไม่มีสิทธิ์เข้าถึง",
  })
  @ApiResponse({
    status: 404,
    description: "ไม่พบประเภทรถ",
  })
  remove(@Param("id") id: string) {
    return this.vehicleTypeService.remove(id);
  }

  @Get("name/:name")
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth("JWT-auth")
  @ApiOperation({
    summary: "ค้นหาประเภทรถตามชื่อ",
    description: "ค้นหาข้อมูลประเภทรถตามชื่อ",
  })
  @ApiParam({
    name: "name",
    description: "ชื่อประเภทรถ",
    example: "รถบรรทุก 10 ล้อ",
  })
  @ApiResponse({
    status: 200,
    description: "ดึงข้อมูลสำเร็จ",
    schema: {
      example: {
        id: "uuid-string",
        name: "รถบรรทุก 10 ล้อ",
        description: "รถบรรทุกขนาดใหญ่สำหรับขนส่งน้ำตาล",
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
    description: "ไม่พบประเภทรถ",
  })
  findByName(@Param("name") name: string) {
    return this.vehicleTypeService.findByName(name);
  }
}
