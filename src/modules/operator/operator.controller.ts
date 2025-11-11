import { Controller, Get, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';

@ApiTags('operator')
@Controller('operator')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('operator', 'admin') // Allow both operator and admin
@ApiBearerAuth('JWT-auth')
export class OperatorController {

  @Get('counting-sessions')
  @ApiOperation({
    summary: 'Get counting sessions',
    description: 'Get counting sessions data (operator and admin only)',
  })
  @ApiResponse({
    status: 200,
    description: 'Counting sessions retrieved successfully',
    schema: {
      example: {
        sessions: [
          {
            id: 'uuid-string',
            type: 'sack',
            totalCount: 150,
            date: '2025-11-10',
          },
        ],
      },
    },
  })
  @ApiResponse({
    status: 403,
    description: 'Access denied. Operator or admin role required',
  })
  getCountingSessions() {
    return {
      sessions: [
        {
          id: 'uuid-string',
          type: 'sack',
          totalCount: 150,
          date: '2025-11-10',
        },
      ],
    };
  }

  @Get('dashboard')
  @ApiOperation({
    summary: 'Operator dashboard',
    description: 'Get operator dashboard data (operator and admin only)',
  })
  @ApiResponse({
    status: 200,
    description: 'Dashboard data retrieved successfully',
    schema: {
      example: {
        message: 'Welcome to operator dashboard',
        todayCount: 45,
        weeklyAverage: 38,
      },
    },
  })
  @ApiResponse({
    status: 403,
    description: 'Access denied. Operator or admin role required',
  })
  getDashboard() {
    return {
      message: 'Welcome to operator dashboard',
      todayCount: 45,
      weeklyAverage: 38,
    };
  }
}
