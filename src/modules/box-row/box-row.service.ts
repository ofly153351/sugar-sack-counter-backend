import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from "@nestjs/common";
import { DatabaseService } from "../../database/database.service";
import { CreateBoxRowDto } from "./dto/create-box-row.dto";
import { UpdateBoxRowDto } from "./dto/update-box-row.dto";
import { CreateBoxRowByCountingSessionDto } from "./dto/create-box-row-by-counting-session.dto";

@Injectable()
export class BoxRowService {
  constructor(private prisma: DatabaseService) {}

  async create(createBoxRowDto: CreateBoxRowDto) {
    const { sessionId, ...data } = createBoxRowDto;

    // Validate that session exists
    const session = await this.prisma.boxCountingSession.findUnique({
      where: { id: sessionId },
    });

    if (!session) {
      throw new NotFoundException(
        `Box counting session with ID ${sessionId} not found`,
      );
    }

    // Check if row number already exists for this session
    const existingRow = await this.prisma.boxRow.findFirst({
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

    // Create the box row
    const boxRow = await this.prisma.boxRow.create({
      data: {
        sessionId,
        ...data,
      },
      include: {
        session: true,
      },
    });

    // Update total boxes count in the session
    await this.updateSessionTotal(sessionId);

    return boxRow;
  }

  async createByCountingSession(
    createBoxRowByCountingSessionDto: CreateBoxRowByCountingSessionDto,
  ) {
    const { countingSessionId, ...rowData } = createBoxRowByCountingSessionDto;

    // Get the counting session
    const countingSession = await this.prisma.countingSession.findUnique({
      where: { id: countingSessionId },
      include: {
        boxSession: true,
      },
    });

    if (!countingSession) {
      throw new NotFoundException(
        `Counting session with ID ${countingSessionId} not found`,
      );
    }

    if (countingSession.sessionType !== "box") {
      throw new BadRequestException(
        `Counting session ${countingSessionId} is not a box session`,
      );
    }

    if (!countingSession.boxSessionId) {
      throw new NotFoundException(
        `Box counting session not found for counting session ${countingSessionId}`,
      );
    }

    // Check if row number already exists for this session
    const existingRow = await this.prisma.boxRow.findFirst({
      where: {
        sessionId: countingSession.boxSessionId,
        rowNumber: rowData.rowNumber,
      },
    });

    if (existingRow) {
      throw new BadRequestException(
        `Row number ${rowData.rowNumber} already exists for session ${countingSession.boxSessionId}`,
      );
    }

    // Create the box row
    const boxRow = await this.prisma.boxRow.create({
      data: {
        sessionId: countingSession.boxSessionId,
        ...rowData,
      },
      include: {
        session: true,
      },
    });

    // Update total boxes count in the session
    await this.updateSessionTotal(countingSession.boxSessionId);

    // Update counting session total count
    await this.updateCountingSessionTotal(countingSessionId);

    return boxRow;
  }

  async findAllBySession(sessionId: string) {
    // Validate that session exists
    const session = await this.prisma.boxCountingSession.findUnique({
      where: { id: sessionId },
    });

    if (!session) {
      throw new NotFoundException(
        `Box counting session with ID ${sessionId} not found`,
      );
    }

    const boxRows = await this.prisma.boxRow.findMany({
      where: { sessionId },
      orderBy: { rowNumber: "asc" },
      include: {
        session: true,
      },
    });

    return boxRows;
  }

  async findOne(id: string) {
    const boxRow = await this.prisma.boxRow.findUnique({
      where: { id },
      include: {
        session: true,
      },
    });

    if (!boxRow) {
      throw new NotFoundException(`Box row with ID ${id} not found`);
    }

    return boxRow;
  }

  async update(id: string, updateBoxRowDto: UpdateBoxRowDto) {
    // Check if box row exists
    const existingBoxRow = await this.prisma.boxRow.findUnique({
      where: { id },
    });

    if (!existingBoxRow) {
      throw new NotFoundException(`Box row with ID ${id} not found`);
    }

    // If rowNumber is being updated, check for conflicts
    if (updateBoxRowDto.rowNumber !== undefined) {
      const conflictingRow = await this.prisma.boxRow.findFirst({
        where: {
          sessionId: existingBoxRow.sessionId,
          rowNumber: updateBoxRowDto.rowNumber,
          NOT: { id },
        },
      });

      if (conflictingRow) {
        throw new BadRequestException(
          `Row number ${updateBoxRowDto.rowNumber} already exists for session ${existingBoxRow.sessionId}`,
        );
      }
    }

    // Update the box row
    const updatedBoxRow = await this.prisma.boxRow.update({
      where: { id },
      data: updateBoxRowDto,
      include: {
        session: true,
      },
    });

    // Update total boxes count in the session if finalCount changed
    if (updateBoxRowDto.finalCount !== undefined) {
      await this.updateSessionTotal(existingBoxRow.sessionId);

      // Also update counting session if applicable
      const countingSession = await this.prisma.countingSession.findFirst({
        where: { boxSessionId: existingBoxRow.sessionId },
      });

      if (countingSession) {
        await this.updateCountingSessionTotal(countingSession.id);
      }
    }

    return updatedBoxRow;
  }

  async remove(id: string) {
    // Check if box row exists
    const boxRow = await this.prisma.boxRow.findUnique({
      where: { id },
    });

    if (!boxRow) {
      throw new NotFoundException(`Box row with ID ${id} not found`);
    }

    const sessionId = boxRow.sessionId;

    // Delete the box row
    await this.prisma.boxRow.delete({
      where: { id },
    });

    // Update total boxes count in the session
    await this.updateSessionTotal(sessionId);

    // Update counting session if applicable
    const countingSession = await this.prisma.countingSession.findFirst({
      where: { boxSessionId: sessionId },
    });

    if (countingSession) {
      await this.updateCountingSessionTotal(countingSession.id);
    }

    return { message: "Box row deleted successfully" };
  }

  async removeAllBySession(sessionId: string) {
    // Validate that session exists
    const session = await this.prisma.boxCountingSession.findUnique({
      where: { id: sessionId },
    });

    if (!session) {
      throw new NotFoundException(
        `Box counting session with ID ${sessionId} not found`,
      );
    }

    // Delete all box rows for the session
    await this.prisma.boxRow.deleteMany({
      where: { sessionId },
    });

    // totalBoxes field has been removed from schema
    // No need to update it anymore

    // Update counting session if applicable
    const countingSession = await this.prisma.countingSession.findFirst({
      where: { boxSessionId: sessionId },
    });

    if (countingSession) {
      await this.updateCountingSessionTotal(countingSession.id);
    }

    return { message: "All box rows deleted successfully" };
  }

  private async updateSessionTotal(sessionId: string) {
    // Calculate total finalCount for all rows in the session
    const result = await this.prisma.boxRow.aggregate({
      where: { sessionId },
      _sum: { finalCount: true },
    });

    const totalBoxes = result._sum.finalCount || 0;

    // totalBoxes field has been removed from schema
    // No need to update it in boxCountingSession anymore
    // Just return the calculated total for counting session update

    return totalBoxes;
  }

  private async updateCountingSessionTotal(countingSessionId: string) {
    const countingSession = await this.prisma.countingSession.findUnique({
      where: { id: countingSessionId },
      include: {
        boxSession: true,
      },
    });

    if (!countingSession || !countingSession.boxSession) {
      return;
    }

    // Update counting session with box session total
    await this.prisma.countingSession.update({
      where: { id: countingSessionId },
      data: {
        // totalCount field has been removed from CountingSession
        // No need to update it anymore
      },
    });
  }
}
