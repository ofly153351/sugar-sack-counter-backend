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
import { VehicleService } from "./vehicle.service";
import { CreateVehicleDto } from "./dto/create-vehicle.dto";
import { UpdateVehicleDto } from "./dto/update-vehicle.dto";
import { JwtAuthGuard } from "../../common/guards/jwt-auth.guard";

@ApiTags("vehicles")
@Controller("vehicles")
export class VehicleController {
  constructor(private readonly vehicleService: VehicleService) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth("JWT-auth")
  @ApiOperation({
    summary: "สร้างข้อมูลรถใหม่",
    description: "สร้างข้อมูลรถใหม่ในระบบ",
  })
  @ApiBody({ type: CreateVehicleDto })
  @ApiResponse({
    status: 201,
    description: "สร้างข้อมูลรถสำเร็จ",
    schema: {
      example: {
        id: "uuid-string",
        vehicleCode: "VH001",
        licensePlate: "กข1234",
        driverName: "สมชาย ใจดี",
        status: "active",
        vehicleTypeId: "uuid-string",
        vehicleType: {
          id: "uuid-string",
          name: "รถบรรทุก 10 ล้อ",
          description: "รถบรรทุกขนาดใหญ่",
        },
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
    description: "รหัสรถหรือป้ายทะเบียนซ้ำ",
  })
  create(@Body() createVehicleDto: CreateVehicleDto) {
    return this.vehicleService.create(createVehicleDto);
  }

  @Get()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth("JWT-auth")
  @ApiOperation({
    summary: "ดึงข้อมูลรถทั้งหมด",
    description: "ดึงรายการรถทั้งหมดในระบบ",
  })
  @ApiQuery({
    name: "status",
    required: false,
    description: "กรองตามสถานะรถ",
    enum: ["active", "inactive", "maintenance"],
  })
  @ApiResponse({
    status: 200,
    description: "ดึงข้อมูลสำเร็จ",
    schema: {
      example: [
        {
          id: "uuid-string",
          vehicleCode: "VH001",
          licensePlate: "กข1234",
          driverName: "สมชาย ใจดี",
          status: "active",
          vehicleTypeId: "uuid-string",
          vehicleType: {
            id: "uuid-string",
            name: "รถบรรทุก 10 ล้อ",
            description: "รถบรรทุกขนาดใหญ่",
          },
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
  findAll(@Query("status") status?: string) {
    if (status) {
      return this.vehicleService.getVehiclesByStatus(status);
    }
    return this.vehicleService.findAll();
  }

  @Get("active")
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth("JWT-auth")
  @ApiOperation({
    summary: "ดึงข้อมูลรถที่ใช้งานได้",
    description: "ดึงรายการรถที่มีสถานะ active เท่านั้น",
  })
  @ApiResponse({
    status: 200,
    description: "ดึงข้อมูลสำเร็จ",
    schema: {
      example: [
        {
          id: "uuid-string",
          vehicleCode: "VH001",
          licensePlate: "กข1234",
          driverName: "สมชาย ใจดี",
          status: "active",
          vehicleTypeId: "uuid-string",
          vehicleType: {
            id: "uuid-string",
            name: "รถบรรทุก 10 ล้อ",
            description: "รถบรรทุกขนาดใหญ่",
          },
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
    return this.vehicleService.getActiveVehicles();
  }

  @Get(":id")
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth("JWT-auth")
  @ApiOperation({
    summary: "ดึงข้อมูลรถตาม ID",
    description: "ดึงข้อมูลรถเฉพาะรายตาม ID",
  })
  @ApiParam({
    name: "id",
    description: "ID ของรถ",
    example: "uuid-string",
  })
  @ApiResponse({
    status: 200,
    description: "ดึงข้อมูลสำเร็จ",
    schema: {
      example: {
        id: "uuid-string",
        vehicleCode: "VH001",
        licensePlate: "กข1234",
        driverName: "สมชาย ใจดี",
        status: "active",
        vehicleTypeId: "uuid-string",
        vehicleType: {
          id: "uuid-string",
          name: "รถบรรทุก 10 ล้อ",
          description: "รถบรรทุกขนาดใหญ่",
        },
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
    description: "ไม่พบข้อมูลรถ",
  })
  findOne(@Param("id") id: string) {
    return this.vehicleService.findOne(id);
  }

  @Patch(":id")
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth("JWT-auth")
  @ApiOperation({
    summary: "อัพเดทข้อมูลรถ",
    description: "อัพเดทข้อมูลรถตาม ID",
  })
  @ApiParam({
    name: "id",
    description: "ID ของรถ",
    example: "uuid-string",
  })
  @ApiBody({ type: UpdateVehicleDto })
  @ApiResponse({
    status: 200,
    description: "อัพเดทข้อมูลสำเร็จ",
    schema: {
      example: {
        id: "uuid-string",
        vehicleCode: "VH002",
        licensePlate: "กข5678",
        driverName: "สมหญิง ใจดี",
        status: "active",
        vehicleTypeId: "uuid-string",
        vehicleType: {
          id: "uuid-string",
          name: "รถบรรทุก 10 ล้อ",
          description: "รถบรรทุกขนาดใหญ่",
        },
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
    description: "ไม่พบข้อมูลรถ",
  })
  @ApiResponse({
    status: 409,
    description: "รหัสรถหรือป้ายทะเบียนซ้ำ",
  })
  update(@Param("id") id: string, @Body() updateVehicleDto: UpdateVehicleDto) {
    return this.vehicleService.update(id, updateVehicleDto);
  }

  @Delete(":id")
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth("JWT-auth")
  @ApiOperation({
    summary: "ลบข้อมูลรถ",
    description: "ลบข้อมูลรถตาม ID (ไม่สามารถลบรถที่มีประวัติการนับได้)",
  })
  @ApiParam({
    name: "id",
    description: "ID ของรถ",
    example: "uuid-string",
  })
  @ApiResponse({
    status: 200,
    description: "ลบข้อมูลรถสำเร็จ",
    schema: {
      example: {
        message: "Vehicle deleted successfully",
      },
    },
  })
  @ApiResponse({
    status: 400,
    description: "ไม่สามารถลบรถที่มีประวัติการนับได้",
  })
  @ApiResponse({
    status: 401,
    description: "ไม่มีสิทธิ์เข้าถึง",
  })
  @ApiResponse({
    status: 404,
    description: "ไม่พบข้อมูลรถ",
  })
  remove(@Param("id") id: string) {
    return this.vehicleService.remove(id);
  }

  @Get("code/:vehicleCode")
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth("JWT-auth")
  @ApiOperation({
    summary: "ค้นหารถตามรหัสรถ",
    description: "ค้นหาข้อมูลรถตามรหัสรถ",
  })
  @ApiParam({
    name: "vehicleCode",
    description: "รหัสรถ",
    example: "VH001",
  })
  @ApiResponse({
    status: 200,
    description: "ดึงข้อมูลสำเร็จ",
    schema: {
      example: {
        id: "uuid-string",
        vehicleCode: "VH001",
        licensePlate: "กข1234",
        driverName: "สมชาย ใจดี",
        status: "active",
        vehicleTypeId: "uuid-string",
        vehicleType: {
          id: "uuid-string",
          name: "รถบรรทุก 10 ล้อ",
          description: "รถบรรทุกขนาดใหญ่",
        },
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
    description: "ไม่พบข้อมูลรถ",
  })
  findByVehicleCode(@Param("vehicleCode") vehicleCode: string) {
    return this.vehicleService.findByVehicleCode(vehicleCode);
  }

  @Get("license/:licensePlate")
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth("JWT-auth")
  @ApiOperation({
    summary: "ค้นหารถตามป้ายทะเบียน",
    description: "ค้นหาข้อมูลรถตามป้ายทะเบียน",
  })
  @ApiParam({
    name: "licensePlate",
    description: "ป้ายทะเบียนรถ",
    example: "กข1234",
  })
  @ApiResponse({
    status: 200,
    description: "ดึงข้อมูลสำเร็จ",
    schema: {
      example: {
        id: "uuid-string",
        vehicleCode: "VH001",
        licensePlate: "กข1234",
        driverName: "สมชาย ใจดี",
        status: "active",
        vehicleTypeId: "uuid-string",
        vehicleType: {
          id: "uuid-string",
          name: "รถบรรทุก 10 ล้อ",
          description: "รถบรรทุกขนาดใหญ่",
        },
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
    description: "ไม่พบข้อมูลรถ",
  })
  findByLicensePlate(@Param("licensePlate") licensePlate: string) {
    return this.vehicleService.findByLicensePlate(licensePlate);
  }
}
