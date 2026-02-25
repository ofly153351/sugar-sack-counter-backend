import { Controller, Get, UseGuards, Patch, Param, Body } from '@nestjs/common';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiParam, ApiBody } from '@nestjs/swagger';
import { UserService } from '../user/user.service';
import { UpdateUserRoleDto } from './dto/update-user-role.dto';
import { AdminService } from './admin.service';
import { ResetUserPasswordDto } from './dto/reset-user-password.dto';

@ApiTags('admin')
@Controller('admin')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('admin')
export class AdminController {
  constructor(
    private readonly userService: UserService,
    private readonly adminService: AdminService,
  ) {}

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

  @Get('dashboard/summary')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary: 'Admin dashboard summary',
    description:
      'Get summary stats for dashboard (last 7 days, today, totals)',
  })
  @ApiResponse({
    status: 200,
    description: 'Dashboard summary retrieved successfully',
    schema: {
      example: {
        sacks: {
          today: 120,
          last7Days: [
            { date: '2026-02-04', total: 80 },
            { date: '2026-02-05', total: 95 },
          ],
        },
        boxes: {
          today: 60,
          last7Days: [
            { date: '2026-02-04', total: 40 },
            { date: '2026-02-05', total: 55 },
          ],
        },
        totalUsers: 150,
        totalVehicles: 25,
        range: {
          startDate: '2026-02-04',
          endDate: '2026-02-10',
        },
      },
    },
  })
  getDashboardSummary() {
    return this.adminService.getDashboardSummary();
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

  @Patch('users/:id/make-admin')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary: 'Promote user to admin',
    description: 'Assign admin role to a user (admin only)',
  })
  @ApiParam({
    name: 'id',
    description: 'User ID',
    example: 'uuid-string',
  })
  @ApiResponse({
    status: 200,
    description: 'User role updated to admin',
    schema: {
      example: {
        id: 'uuid-string',
        email: 'user@example.com',
        username: 'johndoe',
        role: 'admin',
      },
    },
  })
  @ApiResponse({
    status: 404,
    description: 'User or role not found',
  })
  @ApiResponse({
    status: 403,
    description: 'Access denied. Admin role required',
  })
  makeAdmin(@Param('id') id: string) {
    return this.userService.setRole(id, 'admin');
  }

  @Patch('users/:id/role')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary: 'Update user role',
    description: 'Assign a role to a user (admin only)',
  })
  @ApiParam({
    name: 'id',
    description: 'User ID',
    example: 'uuid-string',
  })
  @ApiBody({ type: UpdateUserRoleDto })
  @ApiResponse({
    status: 200,
    description: 'User role updated',
    schema: {
      example: {
        id: 'uuid-string',
        email: 'user@example.com',
        username: 'johndoe',
        role: 'operator',
      },
    },
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid role',
  })
  @ApiResponse({
    status: 404,
    description: 'User or role not found',
  })
  @ApiResponse({
    status: 403,
    description: 'Access denied. Admin role required',
  })
  updateUserRole(
    @Param('id') id: string,
    @Body() updateUserRoleDto: UpdateUserRoleDto,
  ) {
    return this.userService.setRole(id, updateUserRoleDto.role);
  }

  @Patch('users/:id/password')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary: 'Reset user password',
    description: 'Reset password for a user (admin only)',
  })
  @ApiParam({
    name: 'id',
    description: 'User ID',
    example: 'uuid-string',
  })
  @ApiBody({ type: ResetUserPasswordDto })
  @ApiResponse({
    status: 200,
    description: 'User password updated successfully',
    schema: {
      example: {
        message: 'User password updated successfully',
      },
    },
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid password data',
  })
  @ApiResponse({
    status: 404,
    description: 'User not found',
  })
  @ApiResponse({
    status: 403,
    description: 'Access denied. Admin role required',
  })
  resetUserPassword(
    @Param('id') id: string,
    @Body() resetUserPasswordDto: ResetUserPasswordDto,
  ) {
    return this.userService.resetPasswordByAdmin(id, resetUserPasswordDto.newPassword);
  }
}
