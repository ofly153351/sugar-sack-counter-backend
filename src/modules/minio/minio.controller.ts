import { Controller, Get, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { MinioService } from './minio.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';

@ApiTags('minio')
@Controller('minio')
export class MinioController {
  constructor(private readonly minioService: MinioService) {}

  @Get('health')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary: 'Check MinIO connection health',
    description: 'Check if MinIO storage service is accessible and healthy',
  })
  @ApiResponse({
    status: 200,
    description: 'MinIO health check successful',
    schema: {
      example: {
        healthy: true,
        bucketName: 'sugar-sacks',
        message: 'MinIO connection is healthy',
      },
    },
  })
  @ApiResponse({
    status: 503,
    description: 'MinIO service unavailable',
    schema: {
      example: {
        healthy: false,
        bucketName: 'sugar-sacks',
        message: 'MinIO connection failed: Connection refused',
        error: 'Connection refused',
      },
    },
  })
  async healthCheck() {
    const health = await this.minioService.healthCheck();

    if (health.healthy) {
      return {
        healthy: true,
        bucketName: this.minioService.getBucketName(),
        message: 'MinIO connection is healthy',
      };
    } else {
      return {
        healthy: false,
        bucketName: this.minioService.getBucketName(),
        message: `MinIO connection failed: ${health.error}`,
        error: health.error,
      };
    }
  }

  @Get('config')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary: 'Get MinIO configuration',
    description: 'Get current MinIO configuration (endpoint, bucket, etc.)',
  })
  @ApiResponse({
    status: 200,
    description: 'MinIO configuration retrieved',
    schema: {
      example: {
        endpoint: 'localhost',
        port: 9000,
        bucketName: 'sugar-sacks',
        useSSL: false,
        urlExpiry: 86400,
      },
    },
  })
  getConfig() {
    return {
      endpoint: process.env.MINIO_ENDPOINT || 'localhost',
      port: parseInt(process.env.MINIO_PORT || '9000', 10),
      bucketName: this.minioService.getBucketName(),
      useSSL: process.env.MINIO_USE_SSL === 'true',
      urlExpiry: parseInt(process.env.MINIO_URL_EXPIRY || '86400', 10),
    };
  }
}
