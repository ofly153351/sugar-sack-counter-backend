import {
  Controller,
  Post,
  UseInterceptors,
  UploadedFile,
  BadRequestException,
} from "@nestjs/common";
import { FileInterceptor } from "@nestjs/platform-express";
import { AiDetectorService, DetectionResult } from "./ai-detector.service";

@Controller("ai")
export class AiDetectorController {
  constructor(private readonly aiDetectorService: AiDetectorService) {}

  @Post("detect")
  @UseInterceptors(FileInterceptor("image"))
  async detectPersons(@UploadedFile() file: Express.Multer.File) {
    if (!file) {
      throw new BadRequestException("No image file provided");
    }

    try {
      const result: DetectionResult =
        await this.aiDetectorService.detectPersons(file);
      return {
        person_count: result.person_count,
        annotated_image: result.annotated_image,
        detections: result.detections,
      };
    } catch (error) {
      throw new BadRequestException(`Detection failed: ${error.message}`);
    }
  }
}
