import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  ParseUUIDPipe,
  UseGuards,
} from "@nestjs/common";
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
} from "@nestjs/swagger";
import { CountingSessionService } from "./counting-session.service";
import { CreateCountingSessionDto } from "./dto/create-counting-session.dto";
import { UpdateCountingSessionDto } from "./dto/update-counting-session.dto";
import { JwtAuthGuard } from "../../common/guards/jwt-auth.guard";

@ApiTags("counting-sessions")
@Controller("counting-sessions")
export class CountingSessionController {
  constructor(
    private readonly countingSessionService: CountingSessionService,
  ) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth("JWT-auth")
  @ApiOperation({ summary: "Create a new counting session" })
  @ApiResponse({
    status: 201,
    description: "Counting session created successfully",
  })
  @ApiResponse({ status: 400, description: "Invalid input data" })
  @ApiResponse({ status: 401, description: "Unauthorized" })
  create(@Body() createCountingSessionDto: CreateCountingSessionDto) {
    return this.countingSessionService.create(createCountingSessionDto);
  }

  @Get()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth("JWT-auth")
  @ApiOperation({ summary: "Get all counting sessions" })
  @ApiResponse({ status: 200, description: "Return all counting sessions" })
  @ApiResponse({ status: 401, description: "Unauthorized" })
  findAll() {
    return this.countingSessionService.findAll();
  }

  @Get("type/:sessionType")
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth("JWT-auth")
  @ApiOperation({ summary: "Get counting sessions by type" })
  @ApiResponse({ status: 200, description: "Return counting sessions by type" })
  @ApiResponse({ status: 400, description: "Invalid session type" })
  @ApiResponse({ status: 401, description: "Unauthorized" })
  findBySessionType(@Param("sessionType") sessionType: string) {
    return this.countingSessionService.findBySessionType(sessionType);
  }

  @Get("user/:userId")
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth("JWT-auth")
  @ApiOperation({ summary: "Get counting sessions by user ID" })
  @ApiResponse({ status: 200, description: "Return counting sessions by user" })
  @ApiResponse({ status: 401, description: "Unauthorized" })
  @ApiResponse({ status: 404, description: "User not found" })
  findByUserId(@Param("userId", ParseUUIDPipe) userId: string) {
    return this.countingSessionService.findByUserId(userId);
  }

  @Get("vehicle/:vehicleId")
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth("JWT-auth")
  @ApiOperation({ summary: "Get counting sessions by vehicle ID" })
  @ApiResponse({
    status: 200,
    description: "Return counting sessions by vehicle",
  })
  @ApiResponse({ status: 401, description: "Unauthorized" })
  @ApiResponse({ status: 404, description: "Vehicle not found" })
  findByVehicleId(@Param("vehicleId", ParseUUIDPipe) vehicleId: string) {
    return this.countingSessionService.findByVehicleId(vehicleId);
  }

  @Get(":id")
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth("JWT-auth")
  @ApiOperation({ summary: "Get a counting session by ID" })
  @ApiResponse({ status: 200, description: "Return counting session" })
  @ApiResponse({ status: 401, description: "Unauthorized" })
  @ApiResponse({ status: 404, description: "Counting session not found" })
  findOne(@Param("id", ParseUUIDPipe) id: string) {
    return this.countingSessionService.findOne(id);
  }

  @Patch(":id")
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth("JWT-auth")
  @ApiOperation({ summary: "Update a counting session" })
  @ApiResponse({
    status: 200,
    description: "Counting session updated successfully",
  })
  @ApiResponse({ status: 401, description: "Unauthorized" })
  @ApiResponse({ status: 404, description: "Counting session not found" })
  update(
    @Param("id", ParseUUIDPipe) id: string,
    @Body() updateCountingSessionDto: UpdateCountingSessionDto,
  ) {
    return this.countingSessionService.update(id, updateCountingSessionDto);
  }

  @Delete(":id")
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth("JWT-auth")
  @ApiOperation({ summary: "Delete a counting session" })
  @ApiResponse({
    status: 200,
    description: "Counting session deleted successfully",
  })
  @ApiResponse({ status: 401, description: "Unauthorized" })
  @ApiResponse({ status: 404, description: "Counting session not found" })
  remove(@Param("id", ParseUUIDPipe) id: string) {
    return this.countingSessionService.remove(id);
  }

  @Get(":id/sack-session-id")
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth("JWT-auth")
  @ApiOperation({ summary: "Get sack session ID from counting session" })
  @ApiParam({
    name: "id",
    description: "ID of the counting session",
    example: "uuid-string",
  })
  @ApiResponse({
    status: 200,
    description: "Return sack session ID",
    schema: {
      example: {
        sackSessionId: "uuid-string",
      },
    },
  })
  @ApiResponse({ status: 400, description: "Not a sack session" })
  @ApiResponse({ status: 401, description: "Unauthorized" })
  @ApiResponse({ status: 404, description: "Counting session not found" })
  getSackSessionId(@Param("id", ParseUUIDPipe) id: string) {
    return this.countingSessionService.getSackSessionId(id);
  }

  @Get(":id/box-session-id")
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth("JWT-auth")
  @ApiOperation({ summary: "Get box session ID from counting session" })
  @ApiParam({
    name: "id",
    description: "ID of the counting session",
    example: "uuid-string",
  })
  @ApiResponse({
    status: 200,
    description: "Return box session ID",
    schema: {
      example: {
        boxSessionId: "uuid-string",
      },
    },
  })
  @ApiResponse({ status: 400, description: "Not a box session" })
  @ApiResponse({ status: 401, description: "Unauthorized" })
  @ApiResponse({ status: 404, description: "Counting session not found" })
  getBoxSessionId(@Param("id", ParseUUIDPipe) id: string) {
    return this.countingSessionService.getBoxSessionId(id);
  }
}
