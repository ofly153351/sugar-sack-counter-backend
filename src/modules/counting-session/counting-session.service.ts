import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from "@nestjs/common";
import { DatabaseService } from "../../database/database.service";
import { CreateCountingSessionDto } from "./dto/create-counting-session.dto";
import { UpdateCountingSessionDto } from "./dto/update-counting-session.dto";
import { plainToInstance } from "class-transformer";
import { CountingSessionResponseDto } from "./dto/counting-session-response.dto";
import { MinioService } from "../minio/minio.service";

@Injectable()
export class CountingSessionService {
  constructor(
    private prisma: DatabaseService,
    private readonly minioService: MinioService,
  ) {}

  async create(createCountingSessionDto: CreateCountingSessionDto) {
    const {
      sessionType,
      sackSessionId,
      boxSessionId,
      userId,
      vehicleId,
      sugarTypeId,
      ...data
    } = createCountingSessionDto;

    // Validate that user exists
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });
    if (!user) {
      throw new NotFoundException(`User with ID ${userId} not found`);
    }

    // Validate that vehicle exists
    const vehicle = await this.prisma.vehicle.findUnique({
      where: { id: vehicleId },
    });
    if (!vehicle) {
      throw new NotFoundException(`Vehicle with ID ${vehicleId} not found`);
    }

    // Validate that sugar type exists
    const sugarType = await this.prisma.sugarType.findUnique({
      where: { id: sugarTypeId },
    });
    if (!sugarType) {
      throw new NotFoundException(
        `Sugar type with ID ${sugarTypeId} not found`,
      );
    }

    // Validate session type and corresponding ID
    if (sessionType === "sack" && sackSessionId) {
      const sackSession = await this.prisma.sackCountingSession.findUnique({
        where: { id: sackSessionId },
      });
      if (!sackSession) {
        throw new NotFoundException(
          `Sack counting session with ID ${sackSessionId} not found`,
        );
      }
    }

    if (sessionType === "box" && boxSessionId) {
      const boxSession = await this.prisma.boxCountingSession.findUnique({
        where: { id: boxSessionId },
      });
      if (!boxSession) {
        throw new NotFoundException(
          `Box counting session with ID ${boxSessionId} not found`,
        );
      }
    }

    // Validate session type
    if (!["sack", "box"].includes(sessionType)) {
      throw new BadRequestException(
        `Invalid session type: ${sessionType}. Must be either "sack" or "box"`,
      );
    }

    // Create counting session with or without sack/box session
    let createdCountingSession;

    if (sessionType === "sack" && !sackSessionId) {
      // Create sack counting session automatically
      const sackCountingSession = await this.prisma.sackCountingSession.create({
        data: {
          vehicleId,
          sugarTypeId,
          userId,
          countingDate: data.countingDate
            ? new Date(data.countingDate)
            : new Date(),
          status: data.status || "in_progress",
        },
      });

      // Create counting session linked to sack counting session
      createdCountingSession = await this.prisma.countingSession.create({
        data: {
          sessionType,
          sackSessionId: sackCountingSession.id,
          userId,
          vehicleId,
          sugarTypeId,
          ...data,
        },
        include: this.getSessionInclude(),
      });
    } else if (sessionType === "box" && !boxSessionId) {
      // Create box counting session automatically
      const boxCountingSession = await this.prisma.boxCountingSession.create({
        data: {
          vehicleId,
          sugarTypeId,
          userId,
          countingDate: data.countingDate
            ? new Date(data.countingDate)
            : new Date(),
          status: data.status || "in_progress",
        },
      });

      // Create counting session linked to box counting session
      createdCountingSession = await this.prisma.countingSession.create({
        data: {
          sessionType,
          boxSessionId: boxCountingSession.id,
          userId,
          vehicleId,
          sugarTypeId,
          ...data,
        },
        include: this.getSessionInclude(),
      });
    } else {
      // Create counting session with existing sack/box session ID
      createdCountingSession = await this.prisma.countingSession.create({
        data: {
          sessionType,
          sackSessionId,
          boxSessionId,
          userId,
          vehicleId,
          sugarTypeId,
          ...data,
        },
        include: this.getSessionInclude(),
      });
    }

    // Transform to exclude sensitive data
    return plainToInstance(CountingSessionResponseDto, createdCountingSession);
  }

  async findAll() {
    const sessions = await this.prisma.countingSession.findMany({
      include: this.getSessionInclude(),
      orderBy: {
        countingDate: "desc",
      },
    });

    // Transform to exclude sensitive data
    return plainToInstance(CountingSessionResponseDto, sessions);
  }

  async findBySessionType(sessionType: string, status?: string) {
    if (!["sack", "box"].includes(sessionType)) {
      throw new BadRequestException(
        `Invalid session type: ${sessionType}. Must be either "sack" or "box"`,
      );
    }

    // Build where clause
    const whereClause: any = { sessionType };

    // Handle status filter
    if (status && status !== "all") {
      whereClause.status = status;
    } else if (!status) {
      // Default status to 'completed' if not provided
      whereClause.status = "completed";
    }
    // If status === "all", don't add status filter

    const sessions = await this.prisma.countingSession.findMany({
      where: whereClause,
      include: this.getSessionInclude(),
      orderBy: {
        countingDate: "desc",
      },
    });

    // Add MinIO URLs to sessions
    const sessionsWithUrls = await Promise.all(
      sessions.map(async (session) => {
        return await this.addMinioUrlsToSession(session);
      }),
    );

    // Transform to exclude sensitive data
    return plainToInstance(CountingSessionResponseDto, sessionsWithUrls);
  }

  async findByUserId(userId: string) {
    const sessions = await this.prisma.countingSession.findMany({
      where: { userId },
      include: this.getSessionInclude(),
      orderBy: {
        countingDate: "desc",
      },
    });

    // Transform to exclude sensitive data
    return plainToInstance(CountingSessionResponseDto, sessions);
  }

  async findByVehicleId(vehicleId: string) {
    const sessions = await this.prisma.countingSession.findMany({
      where: { vehicleId },
      include: this.getSessionInclude(),
      orderBy: {
        countingDate: "desc",
      },
    });

    // Transform to exclude sensitive data
    return plainToInstance(CountingSessionResponseDto, sessions);
  }

  async findOne(id: string) {
    const session = await this.prisma.countingSession.findUnique({
      where: { id },
      include: this.getSessionInclude(),
    });

    if (!session) {
      throw new NotFoundException(`Counting session with ID ${id} not found`);
    }

    // Add MinIO URLs to session
    const sessionWithUrls = await this.addMinioUrlsToSession(session);

    // Transform to exclude sensitive data
    return plainToInstance(CountingSessionResponseDto, sessionWithUrls);
  }

  async update(id: string, updateCountingSessionDto: UpdateCountingSessionDto) {
    const session = await this.findOne(id);

    const {
      sessionType,
      sackSessionId,
      boxSessionId,
      userId,
      vehicleId,
      sugarTypeId,
      ...data
    } = updateCountingSessionDto;

    // Validate that user exists if provided
    if (userId && userId !== session.userId) {
      const user = await this.prisma.user.findUnique({
        where: { id: userId },
      });
      if (!user) {
        throw new NotFoundException(`User with ID ${userId} not found`);
      }
    }

    // Validate that vehicle exists if provided
    if (vehicleId && vehicleId !== session.vehicleId) {
      const vehicle = await this.prisma.vehicle.findUnique({
        where: { id: vehicleId },
      });
      if (!vehicle) {
        throw new NotFoundException(`Vehicle with ID ${vehicleId} not found`);
      }
    }

    // Validate that sugar type exists if provided
    if (sugarTypeId && sugarTypeId !== session.sugarTypeId) {
      const sugarType = await this.prisma.sugarType.findUnique({
        where: { id: sugarTypeId },
      });
      if (!sugarType) {
        throw new NotFoundException(
          `Sugar type with ID ${sugarTypeId} not found`,
        );
      }
    }

    // Start a transaction to update both counting session and related session
    const updatedSession = await this.prisma.$transaction(async (prisma) => {
      // Update the counting session
      const countingSession = await prisma.countingSession.update({
        where: { id },
        data: {
          sessionType,
          sackSessionId,
          boxSessionId,
          userId,
          vehicleId,
          sugarTypeId,
          ...data,
        },
        include: this.getSessionInclude(),
      });

      // If status is being updated, also update the related sack/box session
      if (data.status && countingSession) {
        if (
          countingSession.sessionType === "sack" &&
          countingSession.sackSessionId
        ) {
          await prisma.sackCountingSession.update({
            where: { id: countingSession.sackSessionId },
            data: { status: data.status },
          });
        } else if (
          countingSession.sessionType === "box" &&
          countingSession.boxSessionId
        ) {
          await prisma.boxCountingSession.update({
            where: { id: countingSession.boxSessionId },
            data: { status: data.status },
          });
        }
      }

      return countingSession;
    });

    // Transform to exclude sensitive data
    return plainToInstance(CountingSessionResponseDto, updatedSession);
  }

  async remove(id: string) {
    const session = await this.getSessionForDeletion(id);
    const imagePaths = this.collectImagePathsFromSessions([session]);

    await this.prisma.$transaction(async (prisma) => {
      await prisma.countingSession.delete({
        where: { id },
      });

      if (session.sessionType === "sack" && session.sackSessionId) {
        await prisma.sackCountingSession.delete({
          where: { id: session.sackSessionId },
        });
      } else if (session.sessionType === "box" && session.boxSessionId) {
        await prisma.boxCountingSession.delete({
          where: { id: session.boxSessionId },
        });
      }
    });

    const minioResult = await this.deleteImagesFromMinio(imagePaths);

    return {
      message: "Counting session deleted successfully",
      deletedImages: minioResult.deleted,
      failedImageDeletes: minioResult.failed,
    };
  }

  async removeBySessionType(sessionType: string, status?: string) {
    if (!["sack", "box"].includes(sessionType)) {
      throw new BadRequestException(
        `Invalid session type: ${sessionType}. Must be either "sack" or "box"`,
      );
    }

    const whereClause: any = { sessionType };
    if (status && status !== "all") {
      whereClause.status = status;
    }

    const sessions = await this.prisma.countingSession.findMany({
      where: whereClause,
      include: this.getDeleteInclude(),
    });

    if (sessions.length === 0) {
      return {
        message: "No counting sessions found for deletion",
        deletedSessions: 0,
        deletedImages: 0,
        failedImageDeletes: 0,
      };
    }

    const imagePaths = this.collectImagePathsFromSessions(sessions);

    await this.prisma.$transaction(async (prisma) => {
      for (const session of sessions) {
        await prisma.countingSession.delete({
          where: { id: session.id },
        });

        if (session.sessionType === "sack" && session.sackSessionId) {
          await prisma.sackCountingSession.delete({
            where: { id: session.sackSessionId },
          });
        } else if (session.sessionType === "box" && session.boxSessionId) {
          await prisma.boxCountingSession.delete({
            where: { id: session.boxSessionId },
          });
        }
      }
    });

    const minioResult = await this.deleteImagesFromMinio(imagePaths);

    return {
      message: "Counting sessions deleted successfully",
      deletedSessions: sessions.length,
      deletedImages: minioResult.deleted,
      failedImageDeletes: minioResult.failed,
    };
  }

  async getSackSessionId(countingSessionId: string) {
    const session = await this.findOne(countingSessionId);

    if (session.sessionType !== "sack") {
      throw new BadRequestException(
        `Counting session ${countingSessionId} is not a sack session`,
      );
    }

    if (!session.sackSessionId) {
      throw new NotFoundException(
        `Sack counting session not found for counting session ${countingSessionId}`,
      );
    }

    return session.sackSessionId;
  }

  async getBoxSessionId(countingSessionId: string) {
    const session = await this.findOne(countingSessionId);

    if (session.sessionType !== "box") {
      throw new BadRequestException(
        `Counting session ${countingSessionId} is not a box session`,
      );
    }

    if (!session.boxSessionId) {
      throw new NotFoundException(
        `Box counting session not found for counting session ${countingSessionId}`,
      );
    }

    return session.boxSessionId;
  }

  private getSessionInclude() {
    return {
      user: {
        include: {
          profile: true,
        },
      },
      vehicle: true,
      sugarType: true,
      sackSession: {
        include: {
          sackRows: true,
        },
      },
      boxSession: {
        include: {
          boxRows: true,
        },
      },
    };
  }

  private getDeleteInclude() {
    return {
      sackSession: {
        include: {
          sackRows: {
            select: {
              originalImagePath: true,
              annotatedImagePath: true,
            },
          },
        },
      },
      boxSession: {
        include: {
          boxRows: {
            select: {
              originalImagePath: true,
              annotatedImagePath: true,
            },
          },
        },
      },
    };
  }

  private async getSessionForDeletion(id: string) {
    const session = await this.prisma.countingSession.findUnique({
      where: { id },
      include: this.getDeleteInclude(),
    });

    if (!session) {
      throw new NotFoundException(`Counting session with ID ${id} not found`);
    }

    return session;
  }

  private collectImagePathsFromSessions(sessions: any[]): string[] {
    const pathSet = new Set<string>();

    for (const session of sessions) {
      if (session.sackSession?.sackRows?.length > 0) {
        for (const row of session.sackSession.sackRows) {
          if (row.originalImagePath) {
            pathSet.add(row.originalImagePath);
          }
          if (row.annotatedImagePath) {
            pathSet.add(row.annotatedImagePath);
          }
        }
      }

      if (session.boxSession?.boxRows?.length > 0) {
        for (const row of session.boxSession.boxRows) {
          if (row.originalImagePath) {
            pathSet.add(row.originalImagePath);
          }
          if (row.annotatedImagePath) {
            pathSet.add(row.annotatedImagePath);
          }
        }
      }
    }

    return Array.from(pathSet);
  }

  private async deleteImagesFromMinio(imagePaths: string[]) {
    if (imagePaths.length === 0) {
      return { deleted: 0, failed: 0 };
    }

    let deleted = 0;
    let failed = 0;

    await Promise.all(
      imagePaths.map(async (path) => {
        try {
          await this.minioService.deleteObject(path);
          deleted += 1;
        } catch {
          failed += 1;
        }
      }),
    );

    return { deleted, failed };
  }

  /**
   * Add MinIO presigned URLs to session data
   */
  private async addMinioUrlsToSession(session: any): Promise<any> {
    const sessionWithUrls = { ...session };

    // Add URLs to sack rows
    if (sessionWithUrls.sackSession?.sackRows?.length > 0) {
      sessionWithUrls.sackSession.sackRows = await Promise.all(
        sessionWithUrls.sackSession.sackRows.map(async (row: any) => {
          const rowWithUrls = { ...row };

          // Add original image URL
          if (row.originalImagePath) {
            rowWithUrls.originalImageUrl =
              await this.minioService.getPresignedUrl(
                row.originalImagePath,
                86400, // 24 hours expiry
              );
            rowWithUrls.originalImageExists =
              await this.minioService.fileExists(row.originalImagePath);
          }

          // Add annotated image URL
          if (row.annotatedImagePath) {
            rowWithUrls.annotatedImageUrl =
              await this.minioService.getPresignedUrl(
                row.annotatedImagePath,
                86400, // 24 hours expiry
              );
            rowWithUrls.annotatedImageExists =
              await this.minioService.fileExists(row.annotatedImagePath);
          }

          return rowWithUrls;
        }),
      );
    }

    // Add URLs to box rows
    if (sessionWithUrls.boxSession?.boxRows?.length > 0) {
      sessionWithUrls.boxSession.boxRows = await Promise.all(
        sessionWithUrls.boxSession.boxRows.map(async (row: any) => {
          const rowWithUrls = { ...row };

          // Add original image URL
          if (row.originalImagePath) {
            rowWithUrls.originalImageUrl =
              await this.minioService.getPresignedUrl(
                row.originalImagePath,
                86400, // 24 hours expiry
              );
            rowWithUrls.originalImageExists =
              await this.minioService.fileExists(row.originalImagePath);
          }

          // Add annotated image URL
          if (row.annotatedImagePath) {
            rowWithUrls.annotatedImageUrl =
              await this.minioService.getPresignedUrl(
                row.annotatedImagePath,
                86400, // 24 hours expiry
              );
            rowWithUrls.annotatedImageExists =
              await this.minioService.fileExists(row.annotatedImagePath);
          }

          return rowWithUrls;
        }),
      );
    }

    return sessionWithUrls;
  }
}
