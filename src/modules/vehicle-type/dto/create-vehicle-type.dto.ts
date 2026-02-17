import { IsString, IsNotEmpty } from "class-validator";
import { ApiProperty } from "@nestjs/swagger";

export class CreateVehicleTypeDto {
  @ApiProperty({
    description: "ชื่อประเภทรถ",
    example: "รถบรรทุก 10 ล้อ",
    required: true,
  })
  @IsString()
  @IsNotEmpty()
  name: string;
}
