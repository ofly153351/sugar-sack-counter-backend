import { Injectable, NotFoundException } from "@nestjs/common";
import { DatabaseService } from "../../database/database.service";
import { CreateCountingSessionDto } from "./dto/create-counting-session.dto";
import { UpdateCountingSessionDto } from "./dto/update-counting-session.dto";

@Injectable()
export class CountingSessionService {
  constructor(private prisma: DatabaseService) {}

  async create(createCountingSessionDto: CreateCountingSessionDto) {
    const { sessionType, sackSessionId, boxSessionId, ...data } =
      createCountingSessionDto;

    // Validate session type and corresponding ID
    if (sessionType === "sack" && !sackSessionId) {
      throw new Error("sackSessionId is required for sack sessions");
    }
    if (sessionType === "box" && !boxSessionId) {
      throw new Error("boxSessionId is required for box sessions");
    }

    return this.prisma.countingSession.create({
      data: {
        sessionType,
        sackSessionId,
        boxSessionId,
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

  async update(id: string, updateCountingSessionDto: UpdateCountingSessionDto) {
    const session = await this.findOne(id);

    const { sessionType, sackSessionId, boxSessionId, ...data } =
      updateCountingSessionDto;

    // Validate session type and corresponding ID
    if (sessionType === "sack" && !sackSessionId) {
      throw new Error("sackSessionId is required for sack sessions");
    }
    if (sessionType === "box" && !boxSessionId) {
      throw new Error("boxSessionId is required for box sessions");
    }

    return this.prisma.countingSession.update({
      where: { id },
      data: {
        sessionType,
        sackSessionId,
        boxSessionId,
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
