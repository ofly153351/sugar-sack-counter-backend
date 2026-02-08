import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  ParseUUIDPipe,
} from "@nestjs/common";
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
} from "@nestjs/swagger";
import { SackRowService } from "./sack-row.service";
import {
  CreateSackRowDto,
  UpdateSackRowDto,
  CreateSackRowByCountingSessionDto,
} from "./dto";
import { JwtAuthGuard } from "../../common/guards/jwt-auth.guard";

@ApiTags("sack-rows")
@Controller("sack-rows")
export class SackRowController {
  constructor(private readonly sackRowService: SackRowService) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth("JWT-auth")
  @ApiOperation({ summary: "Create a new sack row" })
  @ApiResponse({
    status: 201,
    description: "Sack row created successfully",
    schema: {
      example: {
        id: "uuid-string",
        sessionId: "session-uuid",
        rowNumber: 1,
        weightType: "50kg",
        aiCount: 25,
        finalCount: 24,
        originalImagePath: "uploads/sacks/session-uuid/row-1.jpg",
        annotatedImagePath: "uploads/sacks/session-uuid/row-1_annotated.jpg",
        createdAt: "2024-01-01T00:00:00.000Z",
        updatedAt: "2024-01-01T00:00:00.000Z",
      },
    },
  })
  @ApiResponse({ status: 400, description: "Invalid input data" })
  @ApiResponse({ status: 401, description: "Unauthorized" })
  @ApiResponse({ status: 404, description: "Session not found" })
  create(@Body() createSackRowDto: CreateSackRowDto) {
    return this.sackRowService.create(createSackRowDto);
  }

  @Post("by-counting-session")
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth("JWT-auth")
  @ApiOperation({ summary: "Create a new sack row using counting session ID" })
  @ApiResponse({
    status: 201,
    description: "Sack row created successfully",
    schema: {
      example: {
        id: "uuid-string",
        sessionId: "session-uuid",
        rowNumber: 1,
        weightType: "50kg",
        aiCount: 25,
        finalCount: 24,
        originalImagePath: "uploads/sacks/session-uuid/row-1.jpg",
        annotatedImagePath: "uploads/sacks/session-uuid/row-1_annotated.jpg",
        createdAt: "2024-01-01T00:00:00.000Z",
        updatedAt: "2024-01-01T00:00:00.000Z",
      },
    },
  })
  @ApiResponse({ status: 400, description: "Invalid input data" })
  @ApiResponse({ status: 401, description: "Unauthorized" })
  @ApiResponse({
    status: 404,
    description: "Counting session not found or not a sack session",
  })
  createByCountingSession(
    @Body()
    createSackRowByCountingSessionDto: CreateSackRowByCountingSessionDto,
  ) {
    return this.sackRowService.createByCountingSession(
      createSackRowByCountingSessionDto,
    );
  }

  @Get("session/:sessionId")
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth("JWT-auth")
  @ApiOperation({ summary: "Get all sack rows for a session" })
  @ApiParam({
    name: "sessionId",
    description: "ID of the sack counting session",
    example: "uuid-string",
  })
  @ApiResponse({
    status: 200,
    description: "Return all sack rows for the session",
    schema: {
      example: [
        {
          id: "uuid-string",
          sessionId: "session-uuid",
          rowNumber: 1,
          weightType: "50kg",
          aiCount: 25,
          finalCount: 24,
          originalImagePath: "uploads/sacks/session-uuid/row-1.jpg",
          annotatedImagePath: "uploads/sacks/session-uuid/row-1_annotated.jpg",
          createdAt: "2024-01-01T00:00:00.000Z",
          updatedAt: "2024-01-01T00:00:00.000Z",
        },
      ],
    },
  })
  @ApiResponse({ status: 401, description: "Unauthorized" })
  @ApiResponse({ status: 404, description: "Session not found" })
  findAllBySession(@Param("sessionId", ParseUUIDPipe) sessionId: string) {
    return this.sackRowService.findAllBySession(sessionId);
  }

  @Get(":id")
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth("JWT-auth")
  @ApiOperation({ summary: "Get a sack row by ID" })
  @ApiParam({
    name: "id",
    description: "ID of the sack row",
    example: "uuid-string",
  })
  @ApiResponse({
    status: 200,
    description: "Return sack row",
    schema: {
      example: {
        id: "uuid-string",
        sessionId: "session-uuid",
        rowNumber: 1,
        weightType: "50kg",
        aiCount: 25,
        finalCount: 24,
        originalImagePath: "uploads/sacks/session-uuid/row-1.jpg",
        annotatedImagePath: "uploads/sacks/session-uuid/row-1_annotated.jpg",
        createdAt: "2024-01-01T00:00:00.000Z",
        updatedAt: "2024-01-01T00:00:00.000Z",
      },
    },
  })
  @ApiResponse({ status: 401, description: "Unauthorized" })
  @ApiResponse({ status: 404, description: "Sack row not found" })
  findOne(@Param("id", ParseUUIDPipe) id: string) {
    return this.sackRowService.findOne(id);
  }

  @Patch(":id")
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth("JWT-auth")
  @ApiOperation({ summary: "Update a sack row" })
  @ApiParam({
    name: "id",
    description: "ID of the sack row",
    example: "uuid-string",
  })
  @ApiResponse({
    status: 200,
    description: "Sack row updated successfully",
    schema: {
      example: {
        id: "uuid-string",
        sessionId: "session-uuid",
        rowNumber: 1,
        weightType: "50kg",
        aiCount: 25,
        finalCount: 24,
        originalImagePath: "uploads/sacks/session-uuid/row-1.jpg",
        annotatedImagePath: "uploads/sacks/session-uuid/row-1_annotated.jpg",
        createdAt: "2024-01-01T00:00:00.000Z",
        updatedAt: "2024-01-01T00:00:00.000Z",
      },
    },
  })
  @ApiResponse({ status: 400, description: "Invalid input data" })
  @ApiResponse({ status: 401, description: "Unauthorized" })
  @ApiResponse({ status: 404, description: "Sack row not found" })
  update(
    @Param("id", ParseUUIDPipe) id: string,
    @Body() updateSackRowDto: UpdateSackRowDto,
  ) {
    return this.sackRowService.update(id, updateSackRowDto);
  }

  @Delete(":id")
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth("JWT-auth")
  @ApiOperation({ summary: "Delete a sack row" })
  @ApiParam({
    name: "id",
    description: "ID of the sack row",
    example: "uuid-string",
  })
  @ApiResponse({
    status: 200,
    description: "Sack row deleted successfully",
    schema: {
      example: {
        message: "Sack row deleted successfully",
      },
    },
  })
  @ApiResponse({ status: 401, description: "Unauthorized" })
  @ApiResponse({ status: 404, description: "Sack row not found" })
  remove(@Param("id", ParseUUIDPipe) id: string) {
    return this.sackRowService.remove(id);
  }

  @Delete("session/:sessionId/all")
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth("JWT-auth")
  @ApiOperation({ summary: "Delete all sack rows for a session" })
  @ApiParam({
    name: "sessionId",
    description: "ID of the sack counting session",
    example: "uuid-string",
  })
  @ApiResponse({
    status: 200,
    description: "All sack rows deleted successfully",
    schema: {
      example: {
        message: "All sack rows deleted successfully",
      },
    },
  })
  @ApiResponse({ status: 401, description: "Unauthorized" })
  @ApiResponse({ status: 404, description: "Session not found" })
  removeAllBySession(@Param("sessionId", ParseUUIDPipe) sessionId: string) {
    return this.sackRowService.removeAllBySession(sessionId);
  }
}
