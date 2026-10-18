import { Injectable, HttpException, HttpStatus } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import axios from "axios";
import { Readable } from "stream";

export interface Detection {
  class: string;
  confidence: number;
  bbox: number[];
}

export interface DetectionResult {
  status: string;
  person_count: number;
  annotated_image: string;
  detections: Detection[];
}

@Injectable()
export class AiDetectorService {
  private readonly aiServiceUrl: string;

  constructor(private readonly configService: ConfigService) {
    const configuredUrl = this.configService.get<string>("AI_SERVICE_URL");

    if (!configuredUrl) {
      throw new Error("AI_SERVICE_URL must be configured");
    }

    this.aiServiceUrl = `${configuredUrl.replace(/\/$/, "")}/detect`;
  }

  async detectPersons(file: Express.Multer.File): Promise<DetectionResult> {
    try {
      // Create form data
      const formData = new (require("form-data"))();

      // Convert buffer to stream for form data
      const fileStream = Readable.from(file.buffer);
      formData.append("file", fileStream, {
        filename: file.originalname,
        contentType: file.mimetype,
      });

      // Send request to Rust AI service
      const response = await axios.post(this.aiServiceUrl, formData, {
        headers: formData.getHeaders(),
        timeout: 30000, // 30 second timeout
      });

      return response.data;
    } catch (error: any) {
      if (axios.isAxiosError(error)) {
        if (error.code === "ECONNREFUSED") {
          throw new HttpException(
            "AI service is unavailable. Please ensure the Python AI service is running on port 8082.",
            HttpStatus.SERVICE_UNAVAILABLE,
          );
        }

        if (error.response) {
          throw new HttpException(
            `AI service error: ${error.response.data.error || error.message}`,
            error.response.status || HttpStatus.INTERNAL_SERVER_ERROR,
          );
        }
      }

      throw new HttpException(
        `Detection failed: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}
