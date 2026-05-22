import {
  BadRequestException,
  Controller,
  ForbiddenException,
  Get,
  InternalServerErrorException,
  NotFoundException,
  Param,
  Query,
  Res,
} from "@nestjs/common";
import { ApiOperation, ApiQuery, ApiResponse, ApiTags } from "@nestjs/swagger";
import { Response } from "express";
import { MinioService } from "./minio.service";

@ApiTags("images")
@Controller("images")
export class ImagesController {
  constructor(private readonly minioService: MinioService) {}

  @Get(":objectPath(*)")
  @ApiOperation({
    summary: "Serve image from MinIO (inline or download attachment)",
  })
  @ApiQuery({
    name: "download",
    required: false,
    description: "Use value 1 to force attachment download",
    example: "1",
  })
  @ApiQuery({
    name: "filename",
    required: false,
    description: "Suggested filename when download=1",
    example: "bag-row-1-annotated.jpg",
  })
  @ApiResponse({ status: 200, description: "Image streamed successfully" })
  @ApiResponse({ status: 400, description: "Invalid query parameters" })
  @ApiResponse({ status: 403, description: "Forbidden" })
  @ApiResponse({ status: 404, description: "Object not found" })
  async getImage(
    @Param("objectPath") objectPath: string,
    @Query("download") download?: string,
    @Query("filename") filename?: string,
    @Res() res?: Response,
  ) {
    if (!res) {
      throw new InternalServerErrorException({ message: "Response unavailable" });
    }
    if (!objectPath) {
      throw new BadRequestException({ message: "objectPath is required" });
    }
    if (download !== undefined && download !== "1") {
      throw new BadRequestException({
        message: 'Invalid "download" query, only "1" is supported',
      });
    }

    const forceDownload = download === "1";
    const stat = await this.readStatOrThrow(objectPath);
    const mimeType =
      stat.metaData?.["content-type"] ||
      stat.metaData?.["Content-Type"] ||
      "application/octet-stream";

    const extension = this.extensionFromMimeType(mimeType);
    const fallbackName = `image${extension}`;
    const safeFilename = this.sanitizeFilename(filename, fallbackName);

    res.setHeader("Content-Type", mimeType);
    res.setHeader("X-Content-Type-Options", "nosniff");
    res.setHeader("Cache-Control", "private, max-age=300");
    if (typeof stat.size === "number" && Number.isFinite(stat.size)) {
      res.setHeader("Content-Length", stat.size.toString());
    }

    if (forceDownload) {
      res.setHeader(
        "Content-Disposition",
        `attachment; filename="${safeFilename}"`,
      );
    } else {
      res.setHeader("Content-Disposition", "inline");
    }

    try {
      const stream = await this.minioService.getObjectStream(objectPath);
      stream.on("error", () => {
        if (!res.headersSent) {
          res.status(500).json({ message: "Failed to read object stream" });
        } else {
          res.end();
        }
      });
      stream.pipe(res);
    } catch (error) {
      this.mapMinioError(error);
    }
  }

  private sanitizeFilename(input: string | undefined, fallback: string): string {
    if (!input || input.trim() === "") {
      return fallback;
    }

    const replacedSpaces = input.replace(/\s+/g, "_");
    const noPathOrControl = replacedSpaces
      .replace(/[\/\\]/g, "")
      .replace(/[\x00-\x1F\x7F]/g, "");
    const safe = noPathOrControl.replace(/[^a-zA-Z0-9._-]/g, "");

    return safe.length > 0 ? safe : fallback;
  }

  private extensionFromMimeType(mimeType: string): string {
    switch (mimeType.toLowerCase()) {
      case "image/jpeg":
      case "image/jpg":
        return ".jpg";
      case "image/png":
        return ".png";
      case "image/webp":
        return ".webp";
      case "image/gif":
        return ".gif";
      default:
        return "";
    }
  }

  private async readStatOrThrow(objectPath: string) {
    try {
      return await this.minioService.getObjectStat(objectPath);
    } catch (error) {
      this.mapMinioError(error);
    }
  }

  private mapMinioError(error: any): never {
    const code = error?.code;
    if (code === "NotFound" || code === "NoSuchKey") {
      throw new NotFoundException({ message: "Object not found" });
    }
    if (code === "AccessDenied" || code === "Forbidden") {
      throw new ForbiddenException({ message: "Access denied" });
    }
    if (code === "InvalidObjectName") {
      throw new BadRequestException({ message: "Invalid object path" });
    }
    throw new InternalServerErrorException({ message: "Failed to serve image" });
  }
}
