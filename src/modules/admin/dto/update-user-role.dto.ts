import { IsIn, IsString } from "class-validator";
import { ApiProperty } from "@nestjs/swagger";

const ALLOWED_ROLES = ["admin", "user", "operator", "viewer"] as const;

export class UpdateUserRoleDto {
  @ApiProperty({
    description: "Role to assign to the user",
    example: "operator",
    enum: ALLOWED_ROLES,
  })
  @IsString()
  @IsIn(ALLOWED_ROLES)
  role: (typeof ALLOWED_ROLES)[number];
}
