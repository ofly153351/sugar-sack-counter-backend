import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from "@nestjs/common";
import { DatabaseService } from "../../database/database.service";
import { CreateVehicleDto } from "./dto/create-vehicle.dto";
import { UpdateVehicleDto } from "./dto/update-vehicle.dto";

type SackRowInput = {
  rowNumber: number;
  sackCount?: number;
  bagCount?: number;
};

type SackRow = {
  rowNumber: number;
  sackCount: number;
};

@Injectable()
export class VehicleService {
  constructor(private database: DatabaseService) {}

  private getVehicleInclude() {
    return {
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
    };
  }

  private normalizeSackRows(
    sackRows?: SackRowInput[],
    bagRows?: SackRowInput[],
  ): SackRow[] | null {
    if (sackRows === undefined && bagRows === undefined) {
      return null;
    }

    const sourceRows = sackRows ?? bagRows ?? [];
    if (!Array.isArray(sourceRows)) {
      throw new BadRequestException("sackRows/bagRows must be an array");
    }

    const normalized = sourceRows.map((row, index) => {
      const sackCount = row.sackCount ?? row.bagCount;

      if (!Number.isInteger(row.rowNumber) || row.rowNumber <= 0) {
        throw new BadRequestException(
          `Invalid rowNumber at index ${index}: must be integer > 0`,
        );
      }

      if (sackCount === undefined) {
        throw new BadRequestException(
          `Missing sackCount/bagCount at index ${index}`,
        );
      }

      if (!Number.isInteger(sackCount) || sackCount < 0) {
        throw new BadRequestException(
          `Invalid sackCount/bagCount at index ${index}: must be integer >= 0`,
        );
      }

      return {
        rowNumber: row.rowNumber,
        sackCount,
      };
    });

    const rowNumberSet = new Set<number>();
    for (const row of normalized) {
      if (rowNumberSet.has(row.rowNumber)) {
        throw new BadRequestException(`Duplicate rowNumber: ${row.rowNumber}`);
      }
      rowNumberSet.add(row.rowNumber);
    }

    return normalized.sort((a, b) => a.rowNumber - b.rowNumber);
  }

  private parseVehicleRowConf(vehicleRowConf: unknown): SackRow[] {
    if (!Array.isArray(vehicleRowConf)) {
      return [];
    }

    const rows: SackRow[] = [];
    for (const row of vehicleRowConf as any[]) {
      if (
        row &&
        Number.isInteger(row.rowNumber) &&
        row.rowNumber > 0 &&
        Number.isInteger(row.sackCount) &&
        row.sackCount >= 0
      ) {
        rows.push({ rowNumber: row.rowNumber, sackCount: row.sackCount });
      }
    }
    return rows.sort((a, b) => a.rowNumber - b.rowNumber);
  }

  private formatVehicleResponse(vehicle: any) {
    const sackRows = this.parseVehicleRowConf(vehicle.vehicleRowConf);
    const bagRows = sackRows.map((row) => ({
      rowNumber: row.rowNumber,
      bagCount: row.sackCount,
    }));
    const totalSacks = sackRows.reduce((sum, row) => sum + row.sackCount, 0);

    return {
      ...vehicle,
      sackRows,
      bagRows,
      totalSacks,
    };
  }

  async create(createVehicleDto: CreateVehicleDto) {
    const {
      vehicleCode,
      licensePlate,
      vehicleTypeId,
      maxLoadWeightTon,
      driverUserId,
      status,
      sackRows,
      bagRows,
    } = createVehicleDto;

    const normalizedSackRows = this.normalizeSackRows(sackRows, bagRows) ?? [];

    const existingVehicleWithCode = await this.database.vehicle.findUnique({
      where: { vehicleCode },
    });
    if (existingVehicleWithCode) {
      throw new ConflictException("Vehicle code already exists");
    }

    const existingVehicleWithLicensePlate =
      await this.database.vehicle.findUnique({
        where: { licensePlate },
      });
    if (existingVehicleWithLicensePlate) {
      throw new ConflictException("License plate already exists");
    }

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
        maxLoadWeightTon,
        vehicleRowConf: normalizedSackRows,
        driverUserId,
        driverName,
        status: status || "active",
      },
      include: this.getVehicleInclude(),
    });

    return this.formatVehicleResponse(vehicle);
  }

  async findAll() {
    const vehicles = await this.database.vehicle.findMany({
      include: this.getVehicleInclude(),
      orderBy: {
        createdAt: "desc",
      },
    });

    return vehicles.map((vehicle) => this.formatVehicleResponse(vehicle));
  }

  async findOne(id: string) {
    const vehicle = await this.database.vehicle.findUnique({
      where: { id },
      include: this.getVehicleInclude(),
    });

    if (!vehicle) {
      throw new NotFoundException(`Vehicle with ID ${id} not found`);
    }

    return this.formatVehicleResponse(vehicle);
  }

  async findByVehicleCode(vehicleCode: string) {
    const vehicle = await this.database.vehicle.findUnique({
      where: { vehicleCode },
      include: this.getVehicleInclude(),
    });
    if (!vehicle) {
      return null;
    }
    return this.formatVehicleResponse(vehicle);
  }

  async findByLicensePlate(licensePlate: string) {
    const vehicle = await this.database.vehicle.findUnique({
      where: { licensePlate },
      include: this.getVehicleInclude(),
    });
    if (!vehicle) {
      return null;
    }
    return this.formatVehicleResponse(vehicle);
  }

  async update(id: string, updateVehicleDto: UpdateVehicleDto) {
    const vehicle = await this.database.vehicle.findUnique({
      where: { id },
    });

    if (!vehicle) {
      throw new NotFoundException(`Vehicle with ID ${id} not found`);
    }

    const {
      vehicleCode,
      licensePlate,
      vehicleTypeId,
      driverUserId,
      sackRows,
      bagRows,
      ...updateData
    } = updateVehicleDto;

    const normalizedSackRows = this.normalizeSackRows(sackRows, bagRows);

    if (vehicleCode && vehicleCode !== vehicle.vehicleCode) {
      const existingVehicleWithCode = await this.database.vehicle.findUnique({
        where: { vehicleCode },
      });
      if (existingVehicleWithCode) {
        throw new ConflictException("Vehicle code already exists");
      }
    }

    if (licensePlate && licensePlate !== vehicle.licensePlate) {
      const existingVehicleWithLicensePlate =
        await this.database.vehicle.findUnique({
          where: { licensePlate },
        });
      if (existingVehicleWithLicensePlate) {
        throw new ConflictException("License plate already exists");
      }
    }

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
        ...(normalizedSackRows !== null && { vehicleRowConf: normalizedSackRows }),
      },
      include: this.getVehicleInclude(),
    });

    return this.formatVehicleResponse(updatedVehicle);
  }

  async remove(id: string) {
    const vehicle = await this.database.vehicle.findUnique({
      where: { id },
    });

    if (!vehicle) {
      throw new NotFoundException(`Vehicle with ID ${id} not found`);
    }

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
      include: this.getVehicleInclude(),
      orderBy: {
        vehicleCode: "asc",
      },
    });

    return vehicles.map((vehicle) => this.formatVehicleResponse(vehicle));
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
      include: this.getVehicleInclude(),
      orderBy: {
        vehicleCode: "asc",
      },
    });

    return vehicles.map((vehicle) => this.formatVehicleResponse(vehicle));
  }
}
