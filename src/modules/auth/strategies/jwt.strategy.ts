import { Injectable } from "@nestjs/common";
import { PassportStrategy } from "@nestjs/passport";
import { ExtractJwt, Strategy } from "passport-jwt";
import { ConfigService } from "@nestjs/config";
import { UserService } from "../../user/user.service";

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    private configService: ConfigService,
    private userService: UserService,
  ) {
    super({
      jwtFromRequest: (req) => {
        let token = null;
        let tokenSource = "none";

        // 1. Check from cookies (standard cookie-parser)
        if (req && req.cookies) {
          token = req.cookies["access_token"];
          if (token) {
            tokenSource = "cookies";
          }
        }

        // 2. Check from Cookie header (for frontend middleware)
        if (!token && req && req.headers && req.headers.cookie) {
          const cookies = req.headers.cookie.split(";").map((c) => c.trim());
          for (const cookie of cookies) {
            if (cookie.startsWith("access_token=")) {
              token = cookie.substring("access_token=".length);
              tokenSource = "cookie-header";
              break;
            }
          }
        }

        // 3. Check from Authorization header (Bearer token)
        if (!token && req && req.headers && req.headers.authorization) {
          const authHeader = req.headers.authorization;
          if (authHeader.startsWith("Bearer ")) {
            token = authHeader.substring(7); // Remove "Bearer " prefix
            tokenSource = "authorization-header";
          }
        }

        // Debug logging
        if (process.env.NODE_ENV === "development") {
          console.log(`🔑 JWT Token Extraction:`);
          console.log(`   Source: ${tokenSource}`);
          console.log(`   Token exists: ${!!token}`);
          console.log(`   Headers:`, req?.headers);
          console.log(`   Cookies:`, req?.cookies);
        }

        return token;
      },
      ignoreExpiration: false,
      secretOrKey: configService.get("app.jwtSecret"),
    });
  }

  async validate(payload: any) {
    const user = await this.userService.findUserWithRole(payload.sub);
    if (!user) {
      throw new Error("User not found");
    }

    // Return user object with role information
    return {
      id: user.id,
      email: user.email,
      username: user.username,
      role: user.role.name,
    };
  }
}
