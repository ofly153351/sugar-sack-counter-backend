import { Injectable, NotFoundException } from "@nestjs/common";
import { DatabaseService } from "../../database/database.service";
import { CreateUserDto } from "./dto/create-user.dto";
import { UpdateUserDto } from "./dto/update-user.dto";
import * as bcrypt from "bcrypt";

@Injectable()
export class UserService {
  constructor(private database: DatabaseService) {}

  async create(createUserDto: CreateUserDto) {
    const { email, password, username, roleId } = createUserDto;

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12);

    const user = await this.database.user.create({
      data: {
        email,
        password: hashedPassword,
        username,
        role: {
          connect: {
            id: roleId || (await this.getDefaultRoleId()),
          },
        },
      },
    });

    // Remove password from response
    const { password: _, ...result } = user;
    return result;
  }

  async findAll() {
    const users = await this.database.user.findMany({
      select: {
        id: true,
        email: true,
        username: true,
        createdAt: true,
        updatedAt: true,
      },
    });
    return users;
  }

  async findOne(id: string) {
    const user = await this.database.user.findUnique({
      where: { id },
      select: {
        id: true,
        email: true,
        username: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!user) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }

    return user;
  }

  async findByEmail(email: string) {
    return this.database.user.findUnique({
      where: { email },
    });
  }

  async update(id: string, updateUserDto: UpdateUserDto) {
    const user = await this.database.user.findUnique({
      where: { id },
    });

    if (!user) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }

    const updateData: any = { ...updateUserDto };

    // If password is being updated, hash it
    if (updateUserDto.password) {
      updateData.password = await bcrypt.hash(updateUserDto.password, 12);
    }

    const updatedUser = await this.database.user.update({
      where: { id },
      data: updateData,
      select: {
        id: true,
        email: true,
        username: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return updatedUser;
  }

  async remove(id: string) {
    const user = await this.database.user.findUnique({
      where: { id },
    });

    if (!user) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }

    await this.database.user.delete({
      where: { id },
    });

    return { message: "User deleted successfully" };
  }

  async validateUser(email: string, password: string) {
    const user = await this.findByEmail(email);
    if (!user) {
      return null;
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return null;
    }

    const { password: _, ...result } = user;
    return result;
  }

  private async getDefaultRoleId(): Promise<string> {
    // Try to find default role or create one if it doesn't exist
    const defaultRole = await this.database.role.findFirst({
      where: { name: "user" },
    });

    if (defaultRole) {
      return defaultRole.id;
    }

    // Create default role if it doesn't exist
    const newRole = await this.database.role.create({
      data: {
        name: "user",
        description: "Default user role",
      },
    });

    return newRole.id;
  }
}
