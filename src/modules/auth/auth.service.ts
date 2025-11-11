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

    // Set HTTP-only cookie
    response.cookie("access_token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 24 * 60 * 60 * 1000, // 24 hours
      path: "/",
    });

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

    // Set HTTP-only cookie
    response.cookie("access_token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 24 * 60 * 60 * 1000, // 24 hours
      path: "/",
    });

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

    // Set HTTP-only cookie
    response.cookie("access_token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 24 * 60 * 60 * 1000, // 24 hours
      path: "/",
    });

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
}
