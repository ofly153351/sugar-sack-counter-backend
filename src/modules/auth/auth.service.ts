import { Injectable, UnauthorizedException } from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import { UserService } from "../user/user.service";
import { RegisterDto } from "./dto/register.dto";
import { LoginDto } from "./dto/login.dto";

@Injectable()
export class AuthService {
  constructor(
    private userService: UserService,
    private jwtService: JwtService,
  ) {}

  async validateUser(username: string, password: string): Promise<any> {
    const user = await this.userService.validateUser(username, password);
    if (!user) {
      throw new UnauthorizedException("Invalid credentials");
    }
    // Get user with profile data
    const userWithProfile = await this.userService.findOne(user.id);
    return userWithProfile;
  }

  async login(user: any, response: any) {
    // Get user with role and profile data
    const userWithRole = await this.userService.findUserWithRole(user.id);

    const payload = {
      email: user.email,
      sub: user.id,
      role: userWithRole.role.name,
    };
    // Get user with profile data
    const userWithProfile = await this.userService.findOne(user.id);

    const token = this.jwtService.sign(payload);

    // Get request origin for dynamic cookie configuration
    const origin = response.req?.headers?.origin;
    // Set HTTP-only cookie with dynamic options based on origin
    response.cookie("access_token", token, this.getCookieOptions(origin));

    return {
      user: {
        id: user.id,
        email: user.email,
        username: user.username,
        firstName: userWithRole.profile?.firstName,
        lastName: userWithRole.profile?.lastName,
      },
    };
  }

  async register(registerDto: RegisterDto, response: any) {
    // Check if user already exists
    const existingUser = await this.userService.findByEmail(registerDto.email);

    if (existingUser) {
      throw new UnauthorizedException("User already exists");
    }

    // Create new user
    const user = await this.userService.create(registerDto);

    // Get user with role and profile data
    const userWithRole = await this.userService.findUserWithRole(user.id);

    // Generate JWT token
    const payload = {
      email: user.email,
      sub: user.id,
      role: userWithRole.role.name,
    };
    const token = this.jwtService.sign(payload);

    // Get request origin for dynamic cookie configuration
    const origin = response.req?.headers?.origin;
    // Set HTTP-only cookie with dynamic options based on origin
    response.cookie("access_token", token, this.getCookieOptions(origin));

    return {
      user: {
        id: user.id,
        email: user.email,
        username: user.username,
        firstName: userWithRole.profile?.firstName,
        lastName: userWithRole.profile?.lastName,
      },
    };
  }

  async refreshToken(user: any, response: any) {
    // Get user with role data
    const userWithRole = await this.userService.findUserWithRole(user.id);

    const payload = {
      email: user.email,
      sub: user.id,
      role: userWithRole.role.name,
    };
    const token = this.jwtService.sign(payload);

    // Get request origin for dynamic cookie configuration
    const origin = response.req?.headers?.origin;
    // Set HTTP-only cookie with dynamic options based on origin
    response.cookie("access_token", token, this.getCookieOptions(origin));

    return {
      message: "Token refreshed successfully",
    };
  }

  async validateToken(token: string) {
    try {
      const payload = this.jwtService.verify(token);
      const user = await this.userService.findOne(payload.sub);
      return user;
    } catch (error) {
      throw new UnauthorizedException("Invalid token");
    }
  }

  public getCookieOptions(origin?: string) {
    const isProduction = process.env.NODE_ENV === "production";
    const allowLocalhost = process.env.ALLOW_LOCALHOST_COOKIE === "true";
    const cookieDomain = process.env.COOKIE_DOMAIN;

    // Default cookie options
    const options: any = {
      httpOnly: true,
      maxAge: 24 * 60 * 60 * 1000, // 24 hours
      path: "/",
    };

    // Determine if this is a localhost origin
    const isLocalhostOrigin =
      origin &&
      (origin.includes("localhost") ||
        origin.includes("127.0.0.1") ||
        origin.includes("::1"));

    // Determine if this is a secure (HTTPS) origin
    const isSecureOrigin = origin && origin.startsWith("https://");

    // Configure secure flag
    if (isProduction && !allowLocalhost && !isLocalhostOrigin) {
      // Production with non-localhost origin: require secure cookies
      options.secure = true;
    } else if (isLocalhostOrigin) {
      // Localhost origin: cookies can be non-secure
      options.secure = false;
    } else if (isSecureOrigin) {
      // HTTPS origin in production: secure cookies
      options.secure = true;
    } else {
      // Default: follow NODE_ENV
      options.secure = isProduction;
    }

    // Configure sameSite policy
    if (isLocalhostOrigin) {
      // For localhost development, use 'lax' or 'none' with secure=false
      options.sameSite = "lax";
    } else if (isProduction && !isLocalhostOrigin) {
      // Production with non-localhost: use 'lax' for better security
      options.sameSite = "lax";
    } else {
      // Default: 'lax'
      options.sameSite = "lax";
    }

    // Set domain if configured
    if (cookieDomain) {
      options.domain = cookieDomain;
    } else if (isProduction && !isLocalhostOrigin && origin) {
      // Auto-set domain from origin in production
      try {
        const url = new URL(origin);
        options.domain = url.hostname;
      } catch (error) {
        // Invalid URL, skip domain setting
      }
    }

    return options;
  }
}
