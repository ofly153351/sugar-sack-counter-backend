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
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { CountingSessionService } from './counting-session.service';
import { CreateCountingSessionDto } from './dto/create-counting-session.dto';
import { UpdateCountingSessionDto } from './dto/update-counting-session.dto';

@ApiTags('counting-sessions')
@Controller('counting-sessions')
export class CountingSessionController {
  constructor(private readonly countingSessionService: CountingSessionService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new counting session' })
  @ApiResponse({ status: 201, description: 'Counting session created successfully' })
  @ApiResponse({ status: 400, description: 'Invalid input data' })
  create(@Body() createCountingSessionDto: CreateCountingSessionDto) {
    return this.countingSessionService.create(createCountingSessionDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all counting sessions' })
  @ApiResponse({ status: 200, description: 'Return all counting sessions' })
  findAll() {
    return this.countingSessionService.findAll();
  }

  @Get('type/:sessionType')
  @ApiOperation({ summary: 'Get counting sessions by type' })
  @ApiResponse({ status: 200, description: 'Return counting sessions by type' })
  @ApiResponse({ status: 400, description: 'Invalid session type' })
  findBySessionType(@Param('sessionType') sessionType: string) {
    return this.countingSessionService.findBySessionType(sessionType);
  }

  @Get('user/:userId')
  @ApiOperation({ summary: 'Get counting sessions by user ID' })
  @ApiResponse({ status: 200, description: 'Return counting sessions by user' })
  @ApiResponse({ status: 404, description: 'User not found' })
  findByUserId(@Param('userId', ParseUUIDPipe) userId: string) {
    return this.countingSessionService.findByUserId(userId);
  }

  @Get('vehicle/:vehicleId')
  @ApiOperation({ summary: 'Get counting sessions by vehicle ID' })
  @ApiResponse({ status: 200, description: 'Return counting sessions by vehicle' })
  @ApiResponse({ status: 404, description: 'Vehicle not found' })
  findByVehicleId(@Param('vehicleId', ParseUUIDPipe) vehicleId: string) {
    return this.countingSessionService.findByVehicleId(vehicleId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a counting session by ID' })
  @ApiResponse({ status: 200, description: 'Return counting session' })
  @ApiResponse({ status: 404, description: 'Counting session not found' })
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.countingSessionService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a counting session' })
  @ApiResponse({ status: 200, description: 'Counting session updated successfully' })
  @ApiResponse({ status: 404, description: 'Counting session not found' })
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateCountingSessionDto: UpdateCountingSessionDto,
  ) {
    return this.countingSessionService.update(id, updateCountingSessionDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a counting session' })
  @ApiResponse({ status: 200, description: 'Counting session deleted successfully' })
  @ApiResponse({ status: 404, description: 'Counting session not found' })
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.countingSessionService.remove(id);
  }
}
