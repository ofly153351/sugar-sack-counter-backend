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
  async logout(@Res() response: Response) {
    const origin = response.req?.headers?.origin;
    const cookieOptions = this.authService.getCookieOptions(origin);
    response.clearCookie("access_token", cookieOptions);
    return response.json({ message: "Logout successful" });
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
        cookieOptions: {},
      },
    },
  })
  async testCookie(@Request() req, @Res() response: Response) {
    // Get origin from request headers
    const origin = req.headers?.origin;

    // Get dynamic cookie options based on origin
    const cookieOptions = this.authService.getCookieOptions(origin);

    // Set a test cookie with dynamic options
    response.cookie("test_cookie", "test_value", cookieOptions);

    return response.json({
      message: "Cookie test successful",
      cookieSet: true,
      cookieOptions: {
        httpOnly: cookieOptions.httpOnly,
        secure: cookieOptions.secure,
        sameSite: cookieOptions.sameSite,
        maxAge: cookieOptions.maxAge,
        path: cookieOptions.path,
        domain: cookieOptions.domain || "not set",
      },
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

  @Post("verify")
  @ApiOperation({
    summary: "Verify JWT token",
    description:
      "Verify JWT token from multiple sources (Cookie header, Authorization header, or body)",
  })
  @ApiBody({
    schema: {
      type: "object",
      properties: {
        token: {
          type: "string",
          description: "JWT token to verify (optional if provided in headers)",
        },
      },
    },
  })
  @ApiResponse({
    status: 200,
    description: "Token verification successful",
    schema: {
      example: {
        valid: true,
        user: {
          id: "uuid-string",
          email: "user@example.com",
          username: "johndoe",
          role: "admin",
        },
      },
    },
  })
  @ApiResponse({
    status: 401,
    description: "Invalid or expired token",
  })
  async verifyToken(@Request() req, @Body() body: { token?: string }) {
    let token: string | null = null;

    // 1. Check token from request body
    if (body?.token) {
      token = body.token;
    }

    // 2. Check from Cookie header (for frontend middleware: Cookie: access_token=xxx)
    if (!token && req.headers?.cookie) {
      const cookies = req.headers.cookie.split(";").map((c) => c.trim());
      for (const cookie of cookies) {
        if (cookie.startsWith("access_token=")) {
          token = cookie.substring("access_token=".length);
          break;
        }
      }
    }

    // 3. Check from Authorization header (Bearer token)
    if (!token && req.headers?.authorization) {
      const authHeader = req.headers.authorization;
      if (authHeader.startsWith("Bearer ")) {
        token = authHeader.substring(7); // Remove "Bearer " prefix
      }
    }

    // 4. Check from cookies (standard cookie-parser)
    if (!token && req.cookies?.access_token) {
      token = req.cookies.access_token;
    }

    if (!token) {
      return {
        valid: false,
        error: "No token found in request",
        sourcesChecked: [
          "body",
          "cookie-header",
          "authorization-header",
          "cookies",
        ],
      };
    }

    try {
      const user = await this.authService.validateToken(token);
      return {
        valid: true,
        user: {
          id: user.id,
          email: user.email,
          username: user.username,
          role: user.role || "user",
        },
        tokenSource: this.getTokenSource(req, body, token),
      };
    } catch (error) {
      return {
        valid: false,
        error: error.message || "Invalid token",
        tokenSource: this.getTokenSource(req, body, token),
      };
    }
  }

  @Get("verify-token")
  @ApiOperation({
    summary: "Debug token extraction",
    description:
      "Debug endpoint to check token extraction from multiple sources",
  })
  @ApiResponse({
    status: 200,
    description: "Debug information about token extraction",
    schema: {
      example: {
        headers: {},
        cookies: {},
        tokenFound: false,
        tokenSource: null,
        user: null,
      },
    },
  })
  async verifyTokenDebug(@Request() req) {
    const tokenSources = {
      body: null as string | null,
      cookieHeader: null as string | null,
      authHeader: null as string | null,
      cookies: null as string | null,
    };

    // Check from Cookie header
    if (req.headers?.cookie) {
      const cookies = req.headers.cookie.split(";").map((c) => c.trim());
      for (const cookie of cookies) {
        if (cookie.startsWith("access_token=")) {
          tokenSources.cookieHeader = cookie.substring("access_token=".length);
          break;
        }
      }
    }

    // Check from Authorization header
    if (req.headers?.authorization) {
      const authHeader = req.headers.authorization;
      if (authHeader.startsWith("Bearer ")) {
        tokenSources.authHeader = authHeader.substring(7);
      }
    }

    // Check from cookies
    if (req.cookies?.access_token) {
      tokenSources.cookies = req.cookies.access_token;
    }

    const allTokens = [
      tokenSources.cookieHeader,
      tokenSources.authHeader,
      tokenSources.cookies,
    ].filter(Boolean);

    let user = null;
    let tokenValid = false;
    let tokenSource = null;

    if (allTokens.length > 0) {
      // Try to validate the first found token
      try {
        user = await this.authService.validateToken(allTokens[0]);
        tokenValid = true;
        tokenSource = this.determineTokenSource(tokenSources, allTokens[0]);
      } catch (error) {
        tokenValid = false;
      }
    }

    return {
      headers: {
        cookie: req.headers?.cookie || null,
        authorization: req.headers?.authorization || null,
      },
      cookies: req.cookies || {},
      tokenSources,
      tokenFound: allTokens.length > 0,
      tokenValid,
      tokenSource,
      user,
    };
  }

  private getTokenSource(req: any, body: any, token: string): string {
    if (body?.token === token) return "request-body";
    if (req.cookies?.access_token === token) return "cookies";

    if (req.headers?.cookie) {
      const cookies = req.headers.cookie.split(";").map((c) => c.trim());
      for (const cookie of cookies) {
        if (
          cookie.startsWith("access_token=") &&
          cookie.substring("access_token=".length) === token
        ) {
          return "cookie-header";
        }
      }
    }

    if (
      req.headers?.authorization &&
      req.headers.authorization.startsWith("Bearer ")
    ) {
      const authToken = req.headers.authorization.substring(7);
      if (authToken === token) return "authorization-header";
    }

    return "unknown";
  }

  private determineTokenSource(tokenSources: any, token: string): string {
    if (tokenSources.cookieHeader === token) return "cookie-header";
    if (tokenSources.authHeader === token) return "authorization-header";
    if (tokenSources.cookies === token) return "cookies";
    return "unknown";
  }

  @Get("debug-token")
  @ApiOperation({
    summary: "Debug token extraction",
    description: "Debug endpoint to check how token is being extracted",
  })
  @ApiResponse({
    status: 200,
    description: "Debug information about token extraction",
    schema: {
      example: {
        headers: {},
        cookies: {},
        user: null,
        tokenExtracted: false,
      },
    },
  })
  async debugToken(@Request() req) {
    return {
      headers: req.headers,
      cookies: req.cookies,
      user: req.user || null,
      tokenExtracted: !!req.user,
    };
  }
}
