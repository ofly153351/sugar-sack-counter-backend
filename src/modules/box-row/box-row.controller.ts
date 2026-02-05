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
import { BoxRowService } from "./box-row.service";
import {
  CreateBoxRowDto,
  UpdateBoxRowDto,
  CreateBoxRowByCountingSessionDto,
} from "./dto";
import { JwtAuthGuard } from "../../common/guards/jwt-auth.guard";

@ApiTags("box-rows")
@Controller("box-rows")
export class BoxRowController {
  constructor(private readonly boxRowService: BoxRowService) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth("JWT-auth")
  @ApiOperation({ summary: "Create a new box row" })
  @ApiResponse({
    status: 201,
    description: "Box row created successfully",
    schema: {
      example: {
        id: "uuid-string",
        sessionId: "session-uuid",
        rowNumber: 1,
        aiCount: 25,
        finalCount: 24,
        originalImagePath: "uploads/boxes/session-uuid/row-1.jpg",
        annotatedImagePath: "uploads/boxes/session-uuid/row-1_annotated.jpg",
        createdAt: "2024-01-01T00:00:00.000Z",
        updatedAt: "2024-01-01T00:00:00.000Z",
      },
    },
  })
  @ApiResponse({ status: 400, description: "Invalid input data" })
  @ApiResponse({ status: 401, description: "Unauthorized" })
  @ApiResponse({ status: 404, description: "Session not found" })
  create(@Body() createBoxRowDto: CreateBoxRowDto) {
    return this.boxRowService.create(createBoxRowDto);
  }

  @Post("by-counting-session")
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth("JWT-auth")
  @ApiOperation({ summary: "Create a new box row using counting session ID" })
  @ApiResponse({
    status: 201,
    description: "Box row created successfully",
    schema: {
      example: {
        id: "uuid-string",
        sessionId: "session-uuid",
        rowNumber: 1,
        aiCount: 25,
        finalCount: 24,
        originalImagePath: "uploads/boxes/session-uuid/row-1.jpg",
        annotatedImagePath: "uploads/boxes/session-uuid/row-1_annotated.jpg",
        createdAt: "2024-01-01T00:00:00.000Z",
        updatedAt: "2024-01-01T00:00:00.000Z",
      },
    },
  })
  @ApiResponse({ status: 400, description: "Invalid input data" })
  @ApiResponse({ status: 401, description: "Unauthorized" })
  @ApiResponse({
    status: 404,
    description: "Counting session not found or not a box session",
  })
  createByCountingSession(
    @Body()
    createBoxRowByCountingSessionDto: CreateBoxRowByCountingSessionDto,
  ) {
    return this.boxRowService.createByCountingSession(
      createBoxRowByCountingSessionDto,
    );
  }

  @Get("session/:sessionId")
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth("JWT-auth")
  @ApiOperation({ summary: "Get all box rows for a session" })
  @ApiParam({
    name: "sessionId",
    description: "ID of the box counting session",
    example: "uuid-string",
  })
  @ApiResponse({
    status: 200,
    description: "Return all box rows for the session",
    schema: {
      example: [
        {
          id: "uuid-string",
          sessionId: "session-uuid",
          rowNumber: 1,
          aiCount: 25,
          finalCount: 24,
          originalImagePath: "uploads/boxes/session-uuid/row-1.jpg",
          annotatedImagePath: "uploads/boxes/session-uuid/row-1_annotated.jpg",
          createdAt: "2024-01-01T00:00:00.000Z",
          updatedAt: "2024-01-01T00:00:00.000Z",
        },
      ],
    },
  })
  @ApiResponse({ status: 401, description: "Unauthorized" })
  @ApiResponse({ status: 404, description: "Session not found" })
  findAllBySession(@Param("sessionId", ParseUUIDPipe) sessionId: string) {
    return this.boxRowService.findAllBySession(sessionId);
  }

  @Get(":id")
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth("JWT-auth")
  @ApiOperation({ summary: "Get a box row by ID" })
  @ApiParam({
    name: "id",
    description: "ID of the box row",
    example: "uuid-string",
  })
  @ApiResponse({
    status: 200,
    description: "Return box row",
    schema: {
      example: {
        id: "uuid-string",
        sessionId: "session-uuid",
        rowNumber: 1,
        aiCount: 25,
        finalCount: 24,
        originalImagePath: "uploads/boxes/session-uuid/row-1.jpg",
        annotatedImagePath: "uploads/boxes/session-uuid/row-1_annotated.jpg",
        createdAt: "2024-01-01T00:00:00.000Z",
        updatedAt: "2024-01-01T00:00:00.000Z",
      },
    },
  })
  @ApiResponse({ status: 401, description: "Unauthorized" })
  @ApiResponse({ status: 404, description: "Box row not found" })
  findOne(@Param("id", ParseUUIDPipe) id: string) {
    return this.boxRowService.findOne(id);
  }

  @Patch(":id")
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth("JWT-auth")
  @ApiOperation({ summary: "Update a box row" })
  @ApiParam({
    name: "id",
    description: "ID of the box row",
    example: "uuid-string",
  })
  @ApiResponse({
    status: 200,
    description: "Box row updated successfully",
    schema: {
      example: {
        id: "uuid-string",
        sessionId: "session-uuid",
        rowNumber: 1,
        aiCount: 25,
        finalCount: 24,
        originalImagePath: "uploads/boxes/session-uuid/row-1.jpg",
        annotatedImagePath: "uploads/boxes/session-uuid/row-1_annotated.jpg",
        createdAt: "2024-01-01T00:00:00.000Z",
        updatedAt: "2024-01-01T00:00:00.000Z",
      },
    },
  })
  @ApiResponse({ status: 400, description: "Invalid input data" })
  @ApiResponse({ status: 401, description: "Unauthorized" })
  @ApiResponse({ status: 404, description: "Box row not found" })
  update(
    @Param("id", ParseUUIDPipe) id: string,
    @Body() updateBoxRowDto: UpdateBoxRowDto,
  ) {
    return this.boxRowService.update(id, updateBoxRowDto);
  }

  @Delete(":id")
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth("JWT-auth")
  @ApiOperation({ summary: "Delete a box row" })
  @ApiParam({
    name: "id",
    description: "ID of the box row",
    example: "uuid-string",
  })
  @ApiResponse({
    status: 200,
    description: "Box row deleted successfully",
    schema: {
      example: {
        message: "Box row deleted successfully",
      },
    },
  })
  @ApiResponse({ status: 401, description: "Unauthorized" })
  @ApiResponse({ status: 404, description: "Box row not found" })
  remove(@Param("id", ParseUUIDPipe) id: string) {
    return this.boxRowService.remove(id);
  }

  @Delete("session/:sessionId/all")
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth("JWT-auth")
  @ApiOperation({ summary: "Delete all box rows for a session" })
  @ApiParam({
    name: "sessionId",
    description: "ID of the box counting session",
    example: "uuid-string",
  })
  @ApiResponse({
    status: 200,
    description: "All box rows deleted successfully",
    schema: {
      example: {
        message: "All box rows deleted successfully",
      },
    },
  })
  @ApiResponse({ status: 401, description: "Unauthorized" })
  @ApiResponse({ status: 404, description: "Session not found" })
  removeAllBySession(@Param("sessionId", ParseUUIDPipe) sessionId: string) {
    return this.boxRowService.removeAllBySession(sessionId);
  }
}
