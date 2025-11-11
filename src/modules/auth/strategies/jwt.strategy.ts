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
        if (req && req.cookies) {
          token = req.cookies["access_token"];
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
