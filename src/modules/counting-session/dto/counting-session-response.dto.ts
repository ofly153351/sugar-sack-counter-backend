import { ApiProperty } from "@nestjs/swagger";
import { Exclude, Expose, Type } from "class-transformer";

// User Profile Response DTO
export class UserProfileResponseDto {
  @Expose()
  @ApiProperty({ description: "Profile ID" })
  id: string;

  @Expose()
  @ApiProperty({ description: "Title" })
  title: string;

  @Expose()
  @ApiProperty({ description: "First name" })
  firstName: string;

  @Expose()
  @ApiProperty({ description: "Last name" })
  lastName: string;

  @Expose()
  @ApiProperty({ description: "Phone number", required: false })
  phone?: string;

  @Expose()
  @ApiProperty({ description: "Position", required: false })
  position?: string;

  @Expose()
  @ApiProperty({ description: "Employee code", required: false })
  employeeCode?: string;

  @Expose()
  @ApiProperty({ description: "Creation timestamp" })
  createdAt: Date;

  @Expose()
  @ApiProperty({ description: "Last update timestamp" })
  updatedAt: Date;
}

// User Response DTO
export class UserResponseDto {
  @Expose()
  @ApiProperty({ description: "User ID" })
  id: string;

  @Expose()
  @ApiProperty({ description: "Username" })
  username: string;

  @Expose()
  @ApiProperty({ description: "Email" })
  email: string;

  @Exclude()
  password?: string;

  @Expose()
  @ApiProperty({ description: "Creation timestamp" })
  createdAt: Date;

  @Expose()
  @ApiProperty({ description: "Last update timestamp" })
  updatedAt: Date;

  @Exclude()
  roleId?: string;

  @Exclude()
  role?: any;

  @Expose()
  @ApiProperty({ description: "User profile", type: UserProfileResponseDto })
  @Type(() => UserProfileResponseDto)
  profile?: UserProfileResponseDto;
}

// Vehicle Response DTO
export class VehicleResponseDto {
  @Expose()
  @ApiProperty({ description: "Vehicle ID" })
  id: string;

  @Expose()
  @ApiProperty({ description: "Vehicle code" })
  vehicleCode: string;

  @Expose()
  @ApiProperty({ description: "License plate" })
  licensePlate: string;

  @Expose()
  @ApiProperty({ description: "Driver name" })
  driverName: string;

  @Expose()
  @ApiProperty({ description: "Vehicle status" })
  status: string;

  @Expose()
  @ApiProperty({ description: "Creation timestamp" })
  createdAt: Date;

  @Expose()
  @ApiProperty({ description: "Last update timestamp" })
  updatedAt: Date;
}

// Sugar Type Response DTO
export class SugarTypeResponseDto {
  @Expose()
  @ApiProperty({ description: "Sugar type ID" })
  id: string;

  @Expose()
  @ApiProperty({ description: "Sugar type name" })
  name: string;

  @Expose()
  @ApiProperty({ description: "Description", required: false })
  description?: string;

  @Expose()
  @ApiProperty({ description: "Creation timestamp" })
  createdAt: Date;

  @Expose()
  @ApiProperty({ description: "Last update timestamp" })
  updatedAt: Date;
}

// Sack Row Response DTO
export class SackRowResponseDto {
  @Expose()
  @ApiProperty({ description: "Sack row ID" })
  id: string;

  @Expose()
  @ApiProperty({ description: "Row number" })
  rowNumber: number;

  @Expose()
  @ApiProperty({
    description: "Weight type",
    enum: ["50kg", "100kg", "custom"],
  })
  weightType: string;

  @Expose()
  @ApiProperty({ description: "AI detected count", required: false })
  aiCount?: number;

  @Expose()
  @ApiProperty({ description: "Final confirmed count" })
  finalCount: number;

  @Expose()
  @ApiProperty({ description: "Original image path", required: false })
  originalImagePath?: string;

  @Expose()
  @ApiProperty({ description: "Annotated image path", required: false })
  annotatedImagePath?: string;

  @Expose()
  @ApiProperty({ description: "Creation timestamp" })
  createdAt: Date;

  @Expose()
  @ApiProperty({ description: "Last update timestamp" })
  updatedAt: Date;
}

// Box Row Response DTO
export class BoxRowResponseDto {
  @Expose()
  @ApiProperty({ description: "Box row ID" })
  id: string;

  @Expose()
  @ApiProperty({ description: "Row number" })
  rowNumber: number;

  @Expose()
  @ApiProperty({ description: "AI detected count", required: false })
  aiCount?: number;

  @Expose()
  @ApiProperty({ description: "Final confirmed count" })
  finalCount: number;

  @Expose()
  @ApiProperty({ description: "Original image path", required: false })
  originalImagePath?: string;

  @Expose()
  @ApiProperty({ description: "Annotated image path", required: false })
  annotatedImagePath?: string;

  @Expose()
  @ApiProperty({ description: "Creation timestamp" })
  createdAt: Date;

  @Expose()
  @ApiProperty({ description: "Last update timestamp" })
  updatedAt: Date;
}

// Sack Counting Session Response DTO
export class SackCountingSessionResponseDto {
  @Expose()
  @ApiProperty({ description: "Sack session ID" })
  id: string;

  @Expose()
  @ApiProperty({ description: "Counting date" })
  countingDate: Date;

  @Expose()
  @ApiProperty({ description: "Session status" })
  status: string;

  @Expose()
  @ApiProperty({ description: "Creation timestamp" })
  createdAt: Date;

  @Expose()
  @ApiProperty({ description: "Last update timestamp" })
  updatedAt: Date;

  @Expose()
  @ApiProperty({ description: "Sack rows", type: [SackRowResponseDto] })
  @Type(() => SackRowResponseDto)
  sackRows: SackRowResponseDto[];
}

// Box Counting Session Response DTO
export class BoxCountingSessionResponseDto {
  @Expose()
  @ApiProperty({ description: "Box session ID" })
  id: string;

  @Expose()
  @ApiProperty({ description: "Counting date" })
  countingDate: Date;

  @Expose()
  @ApiProperty({ description: "Session status" })
  status: string;

  @Expose()
  @ApiProperty({ description: "Creation timestamp" })
  createdAt: Date;

  @Expose()
  @ApiProperty({ description: "Last update timestamp" })
  updatedAt: Date;

  @Expose()
  @ApiProperty({ description: "Box rows", type: [BoxRowResponseDto] })
  @Type(() => BoxRowResponseDto)
  boxRows: BoxRowResponseDto[];
}

// Main Counting Session Response DTO
export class CountingSessionResponseDto {
  @Expose()
  @ApiProperty({ description: "Counting session ID" })
  id: string;

  @Expose()
  @ApiProperty({ description: "Session type", enum: ["sack", "box"] })
  sessionType: string;

  @Expose()
  @ApiProperty({ description: "Sack session ID", required: false })
  sackSessionId?: string;

  @Expose()
  @ApiProperty({ description: "Box session ID", required: false })
  boxSessionId?: string;

  @Expose()
  @ApiProperty({ description: "Counting date" })
  countingDate: Date;

  @Expose()
  @ApiProperty({ description: "Session status" })
  status: string;

  @Expose()
  @ApiProperty({ description: "Creation timestamp" })
  createdAt: Date;

  @Expose()
  @ApiProperty({ description: "Last update timestamp" })
  updatedAt: Date;

  @Expose()
  @ApiProperty({ description: "User ID" })
  userId: string;

  @Expose()
  @ApiProperty({ description: "User information", type: UserResponseDto })
  @Type(() => UserResponseDto)
  user?: UserResponseDto;

  @Expose()
  @ApiProperty({ description: "Vehicle ID" })
  vehicleId: string;

  @Expose()
  @ApiProperty({ description: "Vehicle information", type: VehicleResponseDto })
  @Type(() => VehicleResponseDto)
  vehicle?: VehicleResponseDto;

  @Expose()
  @ApiProperty({ description: "Sugar type ID" })
  sugarTypeId: string;

  @Expose()
  @ApiProperty({
    description: "Sugar type information",
    type: SugarTypeResponseDto,
  })
  @Type(() => SugarTypeResponseDto)
  sugarType?: SugarTypeResponseDto;

  @Expose()
  @ApiProperty({
    description: "Sack session details",
    type: SackCountingSessionResponseDto,
    required: false,
  })
  @Type(() => SackCountingSessionResponseDto)
  sackSession?: SackCountingSessionResponseDto;

  @Exclude()
  totalWeight?: number;

  @Exclude()
  totalCount?: number;

  @Expose()
  @ApiProperty({
    description: "Box session details",
    type: BoxCountingSessionResponseDto,
    required: false,
  })
  @Type(() => BoxCountingSessionResponseDto)
  boxSession?: BoxCountingSessionResponseDto;
}
