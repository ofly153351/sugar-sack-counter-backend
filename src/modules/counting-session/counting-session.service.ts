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

@Injectable()
export class CountingSessionService {
  constructor(private prisma: DatabaseService) {}

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

  async findBySessionType(sessionType: string) {
    if (!["sack", "box"].includes(sessionType)) {
      throw new BadRequestException(
        `Invalid session type: ${sessionType}. Must be either "sack" or "box"`,
      );
    }

    const sessions = await this.prisma.countingSession.findMany({
      where: { sessionType },
      include: this.getSessionInclude(),
      orderBy: {
        countingDate: "desc",
      },
    });

    // Transform to exclude sensitive data
    return plainToInstance(CountingSessionResponseDto, sessions);
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

    // Transform to exclude sensitive data
    return plainToInstance(CountingSessionResponseDto, session);
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
    const session = await this.findOne(id);

    // Delete the counting session
    await this.prisma.countingSession.delete({
      where: { id },
    });

    // Also delete the associated sack/box session if it exists
    if (session.sessionType === "sack" && session.sackSessionId) {
      await this.prisma.sackCountingSession.delete({
        where: { id: session.sackSessionId },
      });
    } else if (session.sessionType === "box" && session.boxSessionId) {
      await this.prisma.boxCountingSession.delete({
        where: { id: session.boxSessionId },
      });
    }

    return { message: "Counting session deleted successfully" };
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
}
