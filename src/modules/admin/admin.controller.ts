import { Controller, Get, UseGuards, Patch, Param, Body } from '@nestjs/common';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiParam, ApiBody } from '@nestjs/swagger';
import { UserService } from '../user/user.service';
import { UpdateUserRoleDto } from './dto/update-user-role.dto';

@ApiTags('admin')
@Controller('admin')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('admin')
export class AdminController {
  constructor(private readonly userService: UserService) {}

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
}
