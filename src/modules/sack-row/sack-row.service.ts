import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from "@nestjs/common";
import { DatabaseService } from "../../database/database.service";
import { CreateSackRowDto } from "./dto/create-sack-row.dto";
import { UpdateSackRowDto } from "./dto/update-sack-row.dto";
import { CreateSackRowByCountingSessionDto } from "./dto/create-sack-row-by-counting-session.dto";

@Injectable()
export class SackRowService {
  constructor(private prisma: DatabaseService) {}

  async create(createSackRowDto: CreateSackRowDto) {
    const { sessionId, ...data } = createSackRowDto;

    // Validate that session exists
    const session = await this.prisma.sackCountingSession.findUnique({
      where: { id: sessionId },
    });

    if (!session) {
      throw new NotFoundException(
        `Sack counting session with ID ${sessionId} not found`,
      );
    }

    // Check if row number already exists for this session
    const existingRow = await this.prisma.sackRow.findFirst({
      where: {
        sessionId,
        rowNumber: data.rowNumber,
      },
    });

    if (existingRow) {
      throw new BadRequestException(
        `Row number ${data.rowNumber} already exists for session ${sessionId}`,
      );
    }

    // Create the sack row
    const sackRow = await this.prisma.sackRow.create({
      data: {
        sessionId,
        ...data,
      },
      include: {
        session: true,
      },
    });

    // Update session totals
    await this.updateSessionTotals(sessionId);

    return sackRow;
  }

  async findAllBySession(sessionId: string) {
    // Validate that session exists
    const session = await this.prisma.sackCountingSession.findUnique({
      where: { id: sessionId },
    });

    if (!session) {
      throw new NotFoundException(
        `Sack counting session with ID ${sessionId} not found`,
      );
    }

    const sackRows = await this.prisma.sackRow.findMany({
      where: { sessionId },
      orderBy: {
        rowNumber: "asc",
      },
      include: {
        session: true,
      },
    });

    return sackRows;
  }

  async findOne(id: string) {
    const sackRow = await this.prisma.sackRow.findUnique({
      where: { id },
      include: {
        session: true,
      },
    });

    if (!sackRow) {
      throw new NotFoundException(`Sack row with ID ${id} not found`);
    }

    return sackRow;
  }

  async update(id: string, updateSackRowDto: UpdateSackRowDto) {
    const sackRow = await this.findOne(id);
    const { sessionId, rowNumber, ...data } = updateSackRowDto;

    // If changing row number, check for duplicates
    if (rowNumber !== undefined && rowNumber !== sackRow.rowNumber) {
      const existingRow = await this.prisma.sackRow.findFirst({
        where: {
          sessionId: sackRow.sessionId,
          rowNumber,
          NOT: { id },
        },
      });

      if (existingRow) {
        throw new BadRequestException(
          `Row number ${rowNumber} already exists for session ${sackRow.sessionId}`,
        );
      }
    }

    // If changing session, validate new session exists
    if (sessionId && sessionId !== sackRow.sessionId) {
      const newSession = await this.prisma.sackCountingSession.findUnique({
        where: { id: sessionId },
      });

      if (!newSession) {
        throw new NotFoundException(
          `Sack counting session with ID ${sessionId} not found`,
        );
      }

      // Check for duplicate row number in new session
      if (rowNumber !== undefined) {
        const existingRow = await this.prisma.sackRow.findFirst({
          where: {
            sessionId,
            rowNumber,
            NOT: { id },
          },
        });

        if (existingRow) {
          throw new BadRequestException(
            `Row number ${rowNumber} already exists in target session ${sessionId}`,
          );
        }
      }
    }

    const updatedSackRow = await this.prisma.sackRow.update({
      where: { id },
      data: {
        ...(sessionId && { sessionId }),
        ...(rowNumber !== undefined && { rowNumber }),
        ...data,
      },
      include: {
        session: true,
      },
    });

    // Update totals for both old and new sessions if session changed
    if (sessionId && sessionId !== sackRow.sessionId) {
      await this.updateSessionTotals(sackRow.sessionId);
      await this.updateSessionTotals(sessionId);
    } else {
      await this.updateSessionTotals(updatedSackRow.sessionId);
    }

    return updatedSackRow;
  }

  async remove(id: string) {
    const sackRow = await this.findOne(id);
    const sessionId = sackRow.sessionId;

    await this.prisma.sackRow.delete({
      where: { id },
    });

    // Update session totals after deletion
    await this.updateSessionTotals(sessionId);

    return { message: "Sack row deleted successfully" };
  }

  async removeAllBySession(sessionId: string) {
    // Validate that session exists
    const session = await this.prisma.sackCountingSession.findUnique({
      where: { id: sessionId },
    });

    if (!session) {
      throw new NotFoundException(
        `Sack counting session with ID ${sessionId} not found`,
      );
    }

    await this.prisma.sackRow.deleteMany({
      where: { sessionId },
    });

    // Reset session totals
    // totalSacks field has been removed from schema
    // No need to update it anymore

    return { message: "All sack rows deleted successfully" };
  }

  private async updateSessionTotals(sessionId: string) {
    // Calculate total sacks from all rows
    const result = await this.prisma.sackRow.aggregate({
      where: { sessionId },
      _sum: {
        finalCount: true,
      },
    });

    const totalSacks = result._sum.finalCount || 0;

    // totalSacks field has been removed from schema
    // No need to update it in sackCountingSession anymore

    // Update counting session if applicable
    const countingSession = await this.prisma.countingSession.findFirst({
      where: { sackSessionId: sessionId },
    });

    if (countingSession) {
      await this.prisma.countingSession.update({
        where: { id: countingSession.id },
        data: {
          totalCount: totalSacks,
        },
      });
    }

    return totalSacks;
  }
  async createByCountingSession(
    createSackRowByCountingSessionDto: CreateSackRowByCountingSessionDto,
  ) {
    const { countingSessionId, ...rowData } = createSackRowByCountingSessionDto;

    // Get the counting session
    const countingSession = await this.prisma.countingSession.findUnique({
      where: { id: countingSessionId },
      include: {
        sackSession: true,
      },
    });

    if (!countingSession) {
      throw new NotFoundException(
        `Counting session with ID ${countingSessionId} not found`,
      );
    }

    // Check if it's a sack session
    if (countingSession.sessionType !== "sack") {
      throw new BadRequestException(
        `Counting session ${countingSessionId} is not a sack session`,
      );
    }

    // Check if sack session exists
    if (!countingSession.sackSessionId) {
      throw new NotFoundException(
        `Sack counting session not found for counting session ${countingSessionId}`,
      );
    }

    // Create the sack row using the sack session ID
    const createSackRowDto: CreateSackRowDto = {
      sessionId: countingSession.sackSessionId,
      ...rowData,
    };

    return this.create(createSackRowDto);
  }
}
