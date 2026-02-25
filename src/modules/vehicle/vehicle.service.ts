import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from "@nestjs/common";
import { DatabaseService } from "../../database/database.service";
import { CreateVehicleDto } from "./dto/create-vehicle.dto";
import { UpdateVehicleDto } from "./dto/update-vehicle.dto";

@Injectable()
export class VehicleService {
  constructor(private database: DatabaseService) {}

  async create(createVehicleDto: CreateVehicleDto) {
    const { vehicleCode, licensePlate, vehicleTypeId, driverUserId, status } =
      createVehicleDto;

    // Check for duplicate vehicle code
    const existingVehicleWithCode = await this.database.vehicle.findUnique({
      where: { vehicleCode },
    });

    if (existingVehicleWithCode) {
      throw new ConflictException("Vehicle code already exists");
    }

    // Check for duplicate license plate
    const existingVehicleWithLicensePlate =
      await this.database.vehicle.findUnique({
        where: { licensePlate },
      });

    if (existingVehicleWithLicensePlate) {
      throw new ConflictException("License plate already exists");
    }

    // Check if vehicle type exists
    const vehicleType = await this.database.vehicleType.findUnique({
      where: { id: vehicleTypeId },
    });

    if (!vehicleType) {
      throw new NotFoundException(`Vehicle type with ID ${vehicleTypeId} not found`);
    }

    const driverUser = await this.database.user.findUnique({
      where: { id: driverUserId },
      include: { profile: true },
    });

    if (!driverUser) {
      throw new NotFoundException(`Driver user with ID ${driverUserId} not found`);
    }

    const firstName = driverUser.profile?.firstName?.trim();
    const lastName = driverUser.profile?.lastName?.trim();
    const driverName =
      [firstName, lastName].filter(Boolean).join(" ").trim() ||
      driverUser.username;

    const vehicle = await this.database.vehicle.create({
      data: {
        vehicleCode,
        licensePlate,
        vehicleTypeId,
        driverUserId,
        driverName,
        status: status || "active",
      },
      include: {
        vehicleType: true,
        driver: {
          select: {
            id: true,
            username: true,
            profile: {
              select: {
                firstName: true,
                lastName: true,
              },
            },
          },
        },
      },
    });

    return vehicle;
  }

  async findAll() {
    const vehicles = await this.database.vehicle.findMany({
      include: {
        vehicleType: true,
        driver: {
          select: {
            id: true,
            username: true,
            profile: {
              select: {
                firstName: true,
                lastName: true,
              },
            },
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return vehicles;
  }

  async findOne(id: string) {
    const vehicle = await this.database.vehicle.findUnique({
      where: { id },
      include: {
        vehicleType: true,
        driver: {
          select: {
            id: true,
            username: true,
            profile: {
              select: {
                firstName: true,
                lastName: true,
              },
            },
          },
        },
      },
    });

    if (!vehicle) {
      throw new NotFoundException(`Vehicle with ID ${id} not found`);
    }

    return vehicle;
  }

  async findByVehicleCode(vehicleCode: string) {
    return this.database.vehicle.findUnique({
      where: { vehicleCode },
      include: {
        vehicleType: true,
        driver: {
          select: {
            id: true,
            username: true,
            profile: {
              select: {
                firstName: true,
                lastName: true,
              },
            },
          },
        },
      },
    });
  }

  async findByLicensePlate(licensePlate: string) {
    return this.database.vehicle.findUnique({
      where: { licensePlate },
      include: {
        vehicleType: true,
        driver: {
          select: {
            id: true,
            username: true,
            profile: {
              select: {
                firstName: true,
                lastName: true,
              },
            },
          },
        },
      },
    });
  }

  async update(id: string, updateVehicleDto: UpdateVehicleDto) {
    const vehicle = await this.database.vehicle.findUnique({
      where: { id },
    });

    if (!vehicle) {
      throw new NotFoundException(`Vehicle with ID ${id} not found`);
    }

    const { vehicleCode, licensePlate, vehicleTypeId, driverUserId, ...updateData } =
      updateVehicleDto;

    // Check for duplicate vehicle code if being updated
    if (vehicleCode && vehicleCode !== vehicle.vehicleCode) {
      const existingVehicleWithCode = await this.database.vehicle.findUnique({
        where: { vehicleCode },
      });

      if (existingVehicleWithCode) {
        throw new ConflictException("Vehicle code already exists");
      }
    }

    // Check for duplicate license plate if being updated
    if (licensePlate && licensePlate !== vehicle.licensePlate) {
      const existingVehicleWithLicensePlate =
        await this.database.vehicle.findUnique({
          where: { licensePlate },
        });

      if (existingVehicleWithLicensePlate) {
        throw new ConflictException("License plate already exists");
      }
    }

    // Check if vehicle type exists if being updated
    if (vehicleTypeId && vehicleTypeId !== vehicle.vehicleTypeId) {
      const vehicleType = await this.database.vehicleType.findUnique({
        where: { id: vehicleTypeId },
      });

      if (!vehicleType) {
        throw new NotFoundException(
          `Vehicle type with ID ${vehicleTypeId} not found`,
        );
      }
    }

    let resolvedDriverName: string | undefined;
    if (driverUserId && driverUserId !== vehicle.driverUserId) {
      const driverUser = await this.database.user.findUnique({
        where: { id: driverUserId },
        include: { profile: true },
      });

      if (!driverUser) {
        throw new NotFoundException(`Driver user with ID ${driverUserId} not found`);
      }

      const firstName = driverUser.profile?.firstName?.trim();
      const lastName = driverUser.profile?.lastName?.trim();
      resolvedDriverName =
        [firstName, lastName].filter(Boolean).join(" ").trim() ||
        driverUser.username;
    }

    const updatedVehicle = await this.database.vehicle.update({
      where: { id },
      data: {
        ...updateData,
        ...(vehicleCode && { vehicleCode }),
        ...(licensePlate && { licensePlate }),
        ...(vehicleTypeId && { vehicleTypeId }),
        ...(driverUserId && { driverUserId }),
        ...(resolvedDriverName && { driverName: resolvedDriverName }),
      },
      include: {
        vehicleType: true,
        driver: {
          select: {
            id: true,
            username: true,
            profile: {
              select: {
                firstName: true,
                lastName: true,
              },
            },
          },
        },
      },
    });

    return updatedVehicle;
  }

  async remove(id: string) {
    const vehicle = await this.database.vehicle.findUnique({
      where: { id },
    });

    if (!vehicle) {
      throw new NotFoundException(`Vehicle with ID ${id} not found`);
    }

    // Check if vehicle has any counting sessions
    const hasSackSessions = await this.database.sackCountingSession.findFirst({
      where: { vehicleId: id },
    });

    const hasBoxSessions = await this.database.boxCountingSession.findFirst({
      where: { vehicleId: id },
    });

    const hasCountingSessions = await this.database.countingSession.findFirst({
      where: { vehicleId: id },
    });

    if (hasSackSessions || hasBoxSessions || hasCountingSessions) {
      throw new BadRequestException(
        "Cannot delete vehicle that has counting sessions. Consider setting status to 'inactive' instead.",
      );
    }

    await this.database.vehicle.delete({
      where: { id },
    });

    return { message: "Vehicle deleted successfully" };
  }

  async getActiveVehicles() {
    const vehicles = await this.database.vehicle.findMany({
      where: { status: "active" },
      include: {
        vehicleType: true,
        driver: {
          select: {
            id: true,
            username: true,
            profile: {
              select: {
                firstName: true,
                lastName: true,
              },
            },
          },
        },
      },
      orderBy: {
        vehicleCode: "asc",
      },
    });

    return vehicles;
  }

  async getVehiclesByStatus(status: string) {
    const validStatuses = ["active", "inactive", "maintenance"];

    if (!validStatuses.includes(status)) {
      throw new BadRequestException(
        `Invalid status. Must be one of: ${validStatuses.join(", ")}`,
      );
    }

    const vehicles = await this.database.vehicle.findMany({
      where: { status },
      include: {
        vehicleType: true,
        driver: {
          select: {
            id: true,
            username: true,
            profile: {
              select: {
                firstName: true,
                lastName: true,
              },
            },
          },
        },
      },
      orderBy: {
        vehicleCode: "asc",
      },
    });

    return vehicles;
  }
}
