import { Controller, Get, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';

@ApiTags('admin')
@Controller('admin')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('admin')
export class AdminController {

  @Get('dashboard')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary: 'Admin dashboard',
    description: 'Get admin dashboard data (admin only)',
  })
  @ApiResponse({
    status: 200,
    description: 'Dashboard data retrieved successfully',
    schema: {
      example: {
        message: 'Welcome to admin dashboard',
        stats: {
          totalUsers: 150,
          activeUsers: 120,
          totalSessions: 500,
        },
      },
    },
  })
  @ApiResponse({
    status: 403,
    description: 'Access denied. Admin role required',
  })
  getDashboard() {
    return {
      message: 'Welcome to admin dashboard',
      stats: {
        totalUsers: 150,
        activeUsers: 120,
        totalSessions: 500,
      },
    };
  }

  @Get('users')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary: 'Get all users',
    description: 'Get list of all users (admin only)',
  })
  @ApiResponse({
    status: 200,
    description: 'Users list retrieved successfully',
    schema: {
      example: {
        users: [
          {
            id: 'uuid-string',
            email: 'user@example.com',
            username: 'johndoe',
            role: 'user',
          },
        ],
      },
    },
  })
  @ApiResponse({
    status: 403,
    description: 'Access denied. Admin role required',
  })
  getUsers() {
    return {
      users: [
        {
          id: 'uuid-string',
          email: 'user@example.com',
          username: 'johndoe',
          role: 'user',
        },
      ],
    };
  }
}
