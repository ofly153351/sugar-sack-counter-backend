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

  async validateUser(email: string, password: string): Promise<any> {
    const user = await this.userService.validateUser(email, password);
    if (!user) {
      throw new UnauthorizedException("Invalid credentials");
    }
    // Get user with profile data
    const userWithProfile = await this.userService.findOne(user.id);
    return userWithProfile;
  }

  async login(user: any) {
    const payload = { email: user.email, sub: user.id };
    // Get user with profile data
    const userWithProfile = await this.userService.findOne(user.id);

    return {
      access_token: this.jwtService.sign(payload),
      user: {
        id: user.id,
        email: user.email,
        username: user.username,
        firstName: userWithProfile.profile?.firstName,
        lastName: userWithProfile.profile?.lastName,
      },
    };
  }

  async register(registerDto: RegisterDto) {
    // Check if user already exists
    const existingUser = await this.userService.findByEmail(registerDto.email);

    if (existingUser) {
      throw new UnauthorizedException("User already exists");
    }

    // Create new user
    const user = await this.userService.create(registerDto);

    // Get user with profile data
    const userWithProfile = await this.userService.findOne(user.id);

    // Generate JWT token
    const payload = { email: user.email, sub: user.id };
    return {
      access_token: this.jwtService.sign(payload),
      user: {
        id: user.id,
        email: user.email,
        username: user.username,
        firstName: userWithProfile.profile?.firstName,
        lastName: userWithProfile.profile?.lastName,
      },
    };
  }

  async refreshToken(user: any) {
    const payload = { email: user.email, sub: user.id };
    return {
      access_token: this.jwtService.sign(payload),
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
