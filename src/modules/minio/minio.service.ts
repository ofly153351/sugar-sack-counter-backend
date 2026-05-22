import { Injectable, Logger } from "@nestjs/common";
import * as Minio from "minio";
import { Readable } from "stream";

@Injectable()
export class MinioService {
  private readonly logger = new Logger(MinioService.name);
  private minioClient: Minio.Client;
  private bucketName: string;

  private publicUrl: string | null;

  constructor() {
    // Load configuration from environment variables
    const endpoint = process.env.MINIO_ENDPOINT || "localhost";
    const port = parseInt(process.env.MINIO_PORT || "9000", 10);
    const accessKey = process.env.MINIO_ACCESS_KEY || "minioadmin";
    const secretKey = process.env.MINIO_SECRET_KEY || "minioadmin";
    const useSSL = process.env.MINIO_USE_SSL === "true";
    this.bucketName = process.env.MINIO_BUCKET_NAME || "sugar-sacks";
    this.publicUrl = process.env.MINIO_PUBLIC_URL || null;

    // Initialize MinIO client
    this.minioClient = new Minio.Client({
      endPoint: endpoint,
      port: port,
      useSSL: useSSL,
      accessKey: accessKey,
      secretKey: secretKey,
    });

    this.logger.log(
      `MinIO client initialized for ${endpoint}:${port} (SSL: ${useSSL})`,
    );
    this.logger.log(`Using bucket: ${this.bucketName}`);
  }

  private normalizeObjectName(objectName: string): string {
    return objectName.startsWith("/") ? objectName.substring(1) : objectName;
  }

  /**
   * Generate presigned URL for a file
   * @param objectName The path/name of the object in MinIO
   * @param expirySeconds URL expiry time in seconds (default: 24 hours)
   * @returns Presigned URL or null if error
   */
  async getPresignedUrl(
    objectName: string,
    expirySeconds: number = 86400,
  ): Promise<string | null> {
    if (!objectName) {
      return null;
    }

    try {
      // Remove leading slash if present
      const cleanObjectName = this.normalizeObjectName(objectName);

      let url = await this.minioClient.presignedGetObject(
        this.bucketName,
        cleanObjectName,
        expirySeconds,
      );

      // Replace internal host with public URL so external clients (e.g. LINE) can access it
      if (this.publicUrl) {
        const generated = new URL(url);
        const pub = new URL(this.publicUrl);
        generated.protocol = pub.protocol;
        generated.hostname = pub.hostname;
        generated.port = pub.port;
        url = generated.toString();
      }

      this.logger.debug(`Generated presigned URL for: ${cleanObjectName}`);
      return url;
    } catch (error) {
      this.logger.error(
        `Failed to generate presigned URL for ${objectName}: ${error.message}`,
      );
      return null;
    }
  }

  /**
   * Generate presigned URLs for multiple files
   * @param objectNames Array of object paths
   * @param expirySeconds URL expiry time in seconds
   * @returns Object with paths as keys and URLs as values
   */
  async getPresignedUrls(
    objectNames: string[],
    expirySeconds: number = 86400,
  ): Promise<Record<string, string | null>> {
    const results: Record<string, string | null> = {};

    await Promise.all(
      objectNames.map(async (objectName) => {
        if (objectName) {
          results[objectName] = await this.getPresignedUrl(
            objectName,
            expirySeconds,
          );
        }
      }),
    );

    return results;
  }

  /**
   * Check if a file exists in MinIO
   * @param objectName The path/name of the object
   * @returns Boolean indicating if file exists
   */
  async fileExists(objectName: string): Promise<boolean> {
    if (!objectName) {
      return false;
    }

    try {
      const cleanObjectName = this.normalizeObjectName(objectName);

      await this.minioClient.statObject(this.bucketName, cleanObjectName);
      return true;
    } catch (error) {
      if (error.code === "NotFound") {
        return false;
      }
      this.logger.error(
        `Error checking file existence for ${objectName}: ${error.message}`,
      );
      return false;
    }
  }

  /**
   * Delete a file in MinIO
   * @param objectName The path/name of the object
   */
  async deleteObject(objectName: string): Promise<void> {
    if (!objectName) {
      return;
    }

    const cleanObjectName = this.normalizeObjectName(objectName);

    try {
      await this.minioClient.removeObject(this.bucketName, cleanObjectName);
      this.logger.debug(`Deleted object from MinIO: ${cleanObjectName}`);
    } catch (error) {
      if (error?.code === "NotFound" || error?.code === "NoSuchKey") {
        // Already removed or missing; treat as success
        return;
      }

      this.logger.error(
        `Failed to delete object ${cleanObjectName}: ${error.message}`,
      );
      throw error;
    }
  }

  /**
   * Health check for MinIO connection
   */
  async healthCheck(): Promise<{ healthy: boolean; error?: string }> {
    try {
      await this.minioClient.listBuckets();
      return { healthy: true };
    } catch (error) {
      this.logger.error(`MinIO health check failed: ${error.message}`);
      return { healthy: false, error: error.message };
    }
  }

  /**
   * Get bucket name
   */
  getBucketName(): string {
    return this.bucketName;
  }

  async getObjectStat(objectName: string): Promise<Minio.BucketItemStat> {
    const cleanObjectName = this.normalizeObjectName(objectName);
    return this.minioClient.statObject(this.bucketName, cleanObjectName);
  }

  async getObjectStream(objectName: string): Promise<Readable> {
    const cleanObjectName = this.normalizeObjectName(objectName);
    return this.minioClient.getObject(this.bucketName, cleanObjectName);
  }
}
