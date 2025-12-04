import {
  Controller,
  Post,
  Body,
  UseGuards,
  Get,
  Request,
  Res,
  Query,
} from "@nestjs/common";
import { AuthService } from "./auth.service";
import { LocalAuthGuard } from "../../common/guards/local-auth.guard";
import { JwtAuthGuard } from "../../common/guards/jwt-auth.guard";
import { LoginDto } from "./dto/login.dto";
import { RegisterDto } from "./dto/register.dto";
import { Response } from "express";
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBody,
  ApiBearerAuth,
} from "@nestjs/swagger";

@ApiTags("auth")
@Controller("auth")
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post("register")
  @ApiOperation({
    summary: "Register new user",
    description: "Create a new user account in the system",
  })
  @ApiBody({ type: RegisterDto })
  @ApiResponse({
    status: 201,
    description: "Registration successful",
    schema: {
      example: {
        id: "uuid-string",
        email: "user@example.com",
        username: "johndoe",
        firstName: "John",
        lastName: "Doe",
      },
    },
  })
  @ApiResponse({
    status: 400,
    description: "Invalid data or email already exists",
  })
  async register(@Body() registerDto: RegisterDto, @Res() response: Response) {
    const result = await this.authService.register(registerDto, response);
    return response.json(result);
  }

  @UseGuards(LocalAuthGuard)
  @Post("login")
  @ApiOperation({
    summary: "User login",
    description: "Login with username and password",
  })
  @ApiBody({ type: LoginDto })
  @ApiResponse({
    status: 200,
    description: "Login successful",
    schema: {
      example: {
        id: "uuid-string",
        email: "user@example.com",
        username: "johndoe",
        firstName: "John",
        lastName: "Doe",
      },
    },
  })
  @ApiResponse({
    status: 401,
    description: "Invalid username or password",
  })
  async login(@Request() req, @Res() response: Response) {
    const result = await this.authService.login(req.user, response);
    return response.json(result);
  }

  @Post("logout")
  @ApiOperation({
    summary: "User logout",
    description: "Clear token and logout from the system",
  })
  @ApiResponse({
    status: 200,
    description: "Logout successful",
    schema: {
      example: {
        message: "Logout successful",
      },
    },
  })
  async logout(@Res({ passthrough: true }) response: Response) {
    response.clearCookie("access_token");
    return { message: "Logout successful" };
  }

  @UseGuards(JwtAuthGuard)
  @Get("profile")
  @ApiBearerAuth("JWT-auth")
  @ApiOperation({
    summary: "Get user profile",
    description: "Get profile information of the current user",
  })
  @ApiResponse({
    status: 200,
    description: "Profile retrieved successfully",
    schema: {
      example: {
        id: "uuid-string",
        email: "user@example.com",
        username: "johndoe",
        firstName: "John",
        lastName: "Doe",
      },
    },
  })
  @ApiResponse({
    status: 401,
    description: "Unauthorized access",
  })
  getProfile(@Request() req) {
    return req.user;
  }

  @UseGuards(JwtAuthGuard)
  @Post("refresh")
  @ApiBearerAuth("JWT-auth")
  @ApiOperation({
    summary: "Refresh token",
    description: "Get new token when the old token is about to expire",
  })
  @ApiResponse({
    status: 200,
    description: "Token refreshed successfully",
    schema: {
      example: {
        message: "Token refreshed successfully",
      },
    },
  })
  @ApiResponse({
    status: 401,
    description: "Invalid token",
  })
  async refreshToken(@Request() req, @Res() response: Response) {
    const result = await this.authService.refreshToken(req.user, response);
    return response.json(result);
  }

  @Get("test-cookie")
  @ApiOperation({
    summary: "Test cookie functionality",
    description: "Test if cookie setting works correctly",
  })
  @ApiResponse({
    status: 200,
    description: "Test successful",
    schema: {
      example: {
        message: "Cookie test successful",
        cookieSet: true,
      },
    },
  })
  async testCookie(@Res() response: Response) {
    // Set a test cookie
    response.cookie("test_cookie", "test_value", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 24 * 60 * 60 * 1000, // 24 hours
      path: "/",
    });

    return response.json({
      message: "Cookie test successful",
      cookieSet: true,
    });
  }

  @UseGuards(JwtAuthGuard)
  @Get("check-role")
  @ApiOperation({
    summary: "Check user role",
    description:
      "Get current user role information from JWT token (uses cookie authentication)",
  })
  @ApiResponse({
    status: 200,
    description: "Role information retrieved successfully",
    schema: {
      example: {
        role: "admin",
      },
    },
  })
  @ApiResponse({
    status: 401,
    description: "Unauthorized - No valid token in cookie",
  })
  async checkRole(@Request() req) {
    const userRole = req.user.role;

    return {
      role: userRole,
    };
  }
}
