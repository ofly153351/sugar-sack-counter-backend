import { ApiProperty } from "@nestjs/swagger";

export class CountingSession {
  @ApiProperty()
  id: string;

  @ApiProperty({ enum: ["sack", "box"] })
  sessionType: string;

  @ApiProperty({ required: false })
  sackSessionId?: string;

  @ApiProperty({ required: false })
  boxSessionId?: string;

  @ApiProperty()
  userId: string;

  @ApiProperty()
  vehicleId: string;

  @ApiProperty()
  sugarTypeId: string;

  @ApiProperty()
  countingDate: Date;

  @ApiProperty()
  status: string;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;

  // Relations
  @ApiProperty({ required: false })
  user?: any;

  @ApiProperty({ required: false })
  vehicle?: any;

  @ApiProperty({ required: false })
  sugarType?: any;

  @ApiProperty({ required: false })
  sackSession?: any;

  @ApiProperty({ required: false })
  boxSession?: any;
}
