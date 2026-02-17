import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from "@nestjs/common";
import { DatabaseService } from "../../database/database.service";
import { CreateSugarTypeDto } from "./dto/create-sugar-type.dto";
import { UpdateSugarTypeDto } from "./dto/update-sugar-type.dto";

@Injectable()
export class SugarTypeService {
  constructor(private database: DatabaseService) {}

  async create(createSugarTypeDto: CreateSugarTypeDto) {
    const { name, productCode } = createSugarTypeDto;

    // Check for duplicate sugar type name
    const existingSugarType = await this.database.sugarType.findFirst({
      where: { name },
    });

    if (existingSugarType) {
      throw new ConflictException("Sugar type name already exists");
    }

    const sugarType = await this.database.sugarType.create({
      data: {
        name,
        productCode,
      },
    });

    return sugarType;
  }

  async findAll() {
    const sugarTypes = await this.database.sugarType.findMany({
      orderBy: {
        name: "asc",
      },
    });

    return sugarTypes;
  }

  async findOne(id: string) {
    const sugarType = await this.database.sugarType.findUnique({
      where: { id },
    });

    if (!sugarType) {
      throw new NotFoundException(`Sugar type with ID ${id} not found`);
    }

    return sugarType;
  }

  async findByName(name: string) {
    return this.database.sugarType.findFirst({
      where: { name },
    });
  }

  async update(id: string, updateSugarTypeDto: UpdateSugarTypeDto) {
    const sugarType = await this.database.sugarType.findUnique({
      where: { id },
    });

    if (!sugarType) {
      throw new NotFoundException(`Sugar type with ID ${id} not found`);
    }

    const { name, ...updateData } = updateSugarTypeDto;

    // Check for duplicate sugar type name if being updated
    if (name && name !== sugarType.name) {
      const existingSugarType = await this.database.sugarType.findFirst({
        where: { name },
      });

      if (existingSugarType) {
        throw new ConflictException("Sugar type name already exists");
      }
    }

    const updatedSugarType = await this.database.sugarType.update({
      where: { id },
      data: {
        ...updateData,
        ...(name && { name }),
      },
    });

    return updatedSugarType;
  }

  async remove(id: string) {
    const sugarType = await this.database.sugarType.findUnique({
      where: { id },
    });

    if (!sugarType) {
      throw new NotFoundException(`Sugar type with ID ${id} not found`);
    }

    // Check if sugar type has any counting sessions
    const hasSackSessions = await this.database.sackCountingSession.findFirst({
      where: { sugarTypeId: id },
    });

    const hasBoxSessions = await this.database.boxCountingSession.findFirst({
      where: { sugarTypeId: id },
    });

    const hasCountingSessions = await this.database.countingSession.findFirst({
      where: { sugarTypeId: id },
    });

    if (hasSackSessions || hasBoxSessions || hasCountingSessions) {
      throw new BadRequestException(
        "Cannot delete sugar type that has counting sessions. Remove or reassign sessions first.",
      );
    }

    await this.database.sugarType.delete({
      where: { id },
    });

    return { message: "Sugar type deleted successfully" };
  }

  async getSugarTypeWithSessions(id: string) {
    const sugarType = await this.database.sugarType.findUnique({
      where: { id },
      include: {
        sackSessions: {
          take: 10,
          orderBy: {
            countingDate: "desc",
          },
          include: {
            vehicle: true,
            user: {
              include: {
                profile: true,
              },
            },
          },
        },
        boxSessions: {
          take: 10,
          orderBy: {
            countingDate: "desc",
          },
          include: {
            vehicle: true,
            user: {
              include: {
                profile: true,
              },
            },
          },
        },
        countingSessions: {
          take: 10,
          orderBy: {
            countingDate: "desc",
          },
          include: {
            vehicle: true,
            user: {
              include: {
                profile: true,
              },
            },
          },
        },
      },
    });

    if (!sugarType) {
      throw new NotFoundException(`Sugar type with ID ${id} not found`);
    }

    return sugarType;
  }

  async searchSugarTypes(searchTerm: string) {
    const sugarTypes = await this.database.sugarType.findMany({
      where: {
        OR: [
          {
            name: {
              contains: searchTerm,
              mode: "insensitive",
            },
          },
          {
            productCode: {
              contains: searchTerm,
              mode: "insensitive",
            },
          },
        ],
      },
      orderBy: {
        name: "asc",
      },
    });

    return sugarTypes;
  }

  async getActiveSugarTypes() {
    const sugarTypes = await this.database.sugarType.findMany({
      where: {
        OR: [
          {
            sackSessions: {
              some: {
                status: "completed",
              },
            },
          },
          {
            boxSessions: {
              some: {
                status: "completed",
              },
            },
          },
          {
            countingSessions: {
              some: {
                status: "completed",
              },
            },
          },
        ],
      },
      orderBy: {
        name: "asc",
      },
    });

    return sugarTypes;
  }
}
