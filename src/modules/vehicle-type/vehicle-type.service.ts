import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from "@nestjs/common";
import { DatabaseService } from "../../database/database.service";
import { CreateVehicleTypeDto } from "./dto/create-vehicle-type.dto";
import { UpdateVehicleTypeDto } from "./dto/update-vehicle-type.dto";

@Injectable()
export class VehicleTypeService {
  constructor(private database: DatabaseService) {}

  async create(createVehicleTypeDto: CreateVehicleTypeDto) {
    const { name } = createVehicleTypeDto;

    // Check for duplicate vehicle type name
    const existingVehicleType = await this.database.vehicleType.findFirst({
      where: { name },
    });

    if (existingVehicleType) {
      throw new ConflictException("Vehicle type name already exists");
    }

    const vehicleType = await this.database.vehicleType.create({
      data: {
        name,
      },
    });

    return vehicleType;
  }

  async findAll() {
    const vehicleTypes = await this.database.vehicleType.findMany({
      orderBy: {
        name: "asc",
      },
    });

    return vehicleTypes;
  }

  async findOne(id: string) {
    const vehicleType = await this.database.vehicleType.findUnique({
      where: { id },
    });

    if (!vehicleType) {
      throw new NotFoundException(`Vehicle type with ID ${id} not found`);
    }

    return vehicleType;
  }

  async findByName(name: string) {
    return this.database.vehicleType.findFirst({
      where: { name },
    });
  }

  async update(id: string, updateVehicleTypeDto: UpdateVehicleTypeDto) {
    const vehicleType = await this.database.vehicleType.findUnique({
      where: { id },
    });

    if (!vehicleType) {
      throw new NotFoundException(`Vehicle type with ID ${id} not found`);
    }

    const { name, ...updateData } = updateVehicleTypeDto;

    // Check for duplicate vehicle type name if being updated
    if (name && name !== vehicleType.name) {
      const existingVehicleType = await this.database.vehicleType.findFirst({
        where: { name },
      });

      if (existingVehicleType) {
        throw new ConflictException("Vehicle type name already exists");
      }
    }

    const updatedVehicleType = await this.database.vehicleType.update({
      where: { id },
      data: {
        ...updateData,
        ...(name && { name }),
      },
    });

    return updatedVehicleType;
  }

  async remove(id: string) {
    const vehicleType = await this.database.vehicleType.findUnique({
      where: { id },
    });

    if (!vehicleType) {
      throw new NotFoundException(`Vehicle type with ID ${id} not found`);
    }

    // Check if vehicle type has any vehicles
    const hasVehicles = await this.database.vehicle.findFirst({
      where: { vehicleTypeId: id },
    });

    if (hasVehicles) {
      throw new BadRequestException(
        "Cannot delete vehicle type that has vehicles assigned. Remove or reassign vehicles first.",
      );
    }

    await this.database.vehicleType.delete({
      where: { id },
    });

    return { message: "Vehicle type deleted successfully" };
  }

  async getVehicleTypeWithVehicles(id: string) {
    const vehicleType = await this.database.vehicleType.findUnique({
      where: { id },
      include: {
        vehicles: {
          where: { status: "active" },
          orderBy: {
            vehicleCode: "asc",
          },
        },
      },
    });

    if (!vehicleType) {
      throw new NotFoundException(`Vehicle type with ID ${id} not found`);
    }

    return vehicleType;
  }

  async searchVehicleTypes(searchTerm: string) {
    const vehicleTypes = await this.database.vehicleType.findMany({
      where: {
        name: {
          contains: searchTerm,
          mode: "insensitive",
        },
      },
      orderBy: {
        name: "asc",
      },
    });

    return vehicleTypes;
  }
}
