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

    // Check if this is a localhost origin (more precise detection)
    const isLocalhostOrigin =
      origin &&
      (origin.startsWith("http://localhost:") ||
        origin.startsWith("http://127.0.0.1:") ||
        origin.includes("localhost:3000") || // frontend localhost
        origin.includes("localhost:3001")); // backend localhost

    // Check if this is HTTPS production domain
    const isProductionDomain =
      origin &&
      (origin.startsWith("https://activitiesmanagement.online") ||
        origin.startsWith("https://www.activitiesmanagement.online"));

    // ⭐️ LOGIC FOR CROSS-ORIGIN COOKIES ⭐️
    if (isLocalhostOrigin && isProduction) {
      // ⚠️ Localhost → Production (Cross-origin)
      // This is the problematic case! Browser restrictions apply

      // For cross-origin localhost → production, we need special handling
      // Modern browsers require sameSite=none AND secure=true for cross-origin
      // But localhost HTTP can't use secure=true

      // Solution 1: Use lax with secure=false (may not work cross-origin)
      // Solution 2: Don't set domain, use lax (better for localhost)
      options.secure = false;
      options.sameSite = "lax";

      // ⚠️ IMPORTANT: Don't set domain for localhost cookies
      // Setting domain will restrict cookie to that domain only
      // options.domain = undefined; // Explicitly don't set

      // Log for debugging
      if (
        process.env.NODE_ENV === "development" ||
        process.env.LOG_COOKIE_SETTINGS === "true"
      ) {
        console.log(
          "🍪 Cross-origin cookie settings (localhost → production):",
          {
            origin,
            secure: options.secure,
            sameSite: options.sameSite,
            domain: "not set",
            note: "Using lax with secure=false for localhost HTTP",
          },
        );
      }
    } else if (isLocalhostOrigin && !isProduction) {
      // Localhost → Localhost (Same-origin development)
      options.secure = false;
      options.sameSite = "lax";
    } else if (isProductionDomain) {
      // Production domain → Production domain (Same-origin production)
      options.secure = true;
      options.sameSite = "lax";

      // Set domain for production cookies
      if (cookieDomain) {
        options.domain = cookieDomain;
      } else {
        // Auto-set domain from origin
        try {
          const url = new URL(origin);
          options.domain = url.hostname;
        } catch (error) {
          // Invalid URL, skip domain setting
        }
      }
    } else if (isProduction && !isLocalhostOrigin) {
      // Other production origins (e.g., other domains)
      options.secure = true;
      options.sameSite = "lax";

      if (cookieDomain) {
        options.domain = cookieDomain;
      }
    } else {
      // Default fallback
      options.secure = isProduction;
      options.sameSite = "lax";
    }

    // Debug logging
    if (
      process.env.NODE_ENV === "development" ||
      process.env.LOG_COOKIE_SETTINGS === "true"
    ) {
      console.log("🍪 Final cookie options:", {
        origin,
        isProduction,
        isLocalhostOrigin,
        isProductionDomain,
        options: {
          httpOnly: options.httpOnly,
          secure: options.secure,
          sameSite: options.sameSite,
          maxAge: options.maxAge,
          path: options.path,
          domain: options.domain || "not set",
        },
      });
    }

    return options;
  }
}
