import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from "@nestjs/common";
import { DatabaseService } from "../../database/database.service";
import { CreateCountingSessionDto } from "./dto/create-counting-session.dto";
import { UpdateCountingSessionDto } from "./dto/update-counting-session.dto";

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

    // Validate session type and corresponding ID (make them optional for initial creation)
    if (sessionType === "sack" && sackSessionId) {
      // If sackSessionId is provided, validate it exists
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
      // If boxSessionId is provided, validate it exists
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
          totalSacks: data.totalCount || 0,
          totalWeight: data.totalWeight || 0,
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
        include: {
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
        },
      });
    } else if (sessionType === "box" && !boxSessionId) {
      // Create box counting session automatically
      const boxCountingSession = await this.prisma.boxCountingSession.create({
        data: {
          vehicleId,
          sugarTypeId,
          userId,
          totalBoxes: data.totalCount || 0,
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
        include: {
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
        },
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
        include: {
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
        },
      });
    }

    return createdCountingSession;
  }

  async findAll() {
    return this.prisma.countingSession.findMany({
      include: {
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
      },
      orderBy: {
        countingDate: "desc",
      },
    });
  }

  async findOne(id: string) {
    const session = await this.prisma.countingSession.findUnique({
      where: { id },
      include: {
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
      },
    });

    if (!session) {
      throw new NotFoundException(`Counting session with ID ${id} not found`);
    }

    return session;
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

    // Validate session type and corresponding ID (make them optional)
    if (sessionType === "sack" && sackSessionId) {
      // If sackSessionId is provided, validate it exists
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
      // If boxSessionId is provided, validate it exists
      const boxSession = await this.prisma.boxCountingSession.findUnique({
        where: { id: boxSessionId },
      });
      if (!boxSession) {
        throw new NotFoundException(
          `Box counting session with ID ${boxSessionId} not found`,
        );
      }
    }

    // Validate session type if provided
    if (sessionType && !["sack", "box"].includes(sessionType)) {
      throw new BadRequestException(
        `Invalid session type: ${sessionType}. Must be either "sack" or "box"`,
      );
    }

    return this.prisma.countingSession.update({
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
      include: {
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
      },
    });
  }

  async remove(id: string) {
    const session = await this.findOne(id);

    return this.prisma.countingSession.delete({
      where: { id },
      include: {
        user: {
          include: {
            profile: true,
          },
        },
        vehicle: true,
        sugarType: true,
      },
    });
  }

  async findBySessionType(sessionType: string) {
    return this.prisma.countingSession.findMany({
      where: { sessionType },
      include: {
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
      },
      orderBy: {
        countingDate: "desc",
      },
    });
  }

  async findByUserId(userId: string) {
    return this.prisma.countingSession.findMany({
      where: { userId },
      include: {
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
      },
      orderBy: {
        countingDate: "desc",
      },
    });
  }

  async findByVehicleId(vehicleId: string) {
    return this.prisma.countingSession.findMany({
      where: { vehicleId },
      include: {
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
      },
      orderBy: {
        countingDate: "desc",
      },
    });
  }
}
