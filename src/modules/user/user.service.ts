import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from "@nestjs/common";
import { DatabaseService } from "../../database/database.service";
import { CreateUserDto } from "./dto/create-user.dto";
import { UpdateUserDto } from "./dto/update-user.dto";
import * as bcrypt from "bcrypt";

@Injectable()
export class UserService {
  constructor(private database: DatabaseService) {}

  async create(createUserDto: CreateUserDto) {
    const {
      email,
      password,
      username,
      roleId,
      firstName,
      lastName,
      employeeCode,
      phone,
      title,
    } = createUserDto;

    // Check for duplicate email
    const existingUserWithEmail = await this.database.user.findUnique({
      where: { email },
    });

    if (existingUserWithEmail) {
      throw new ConflictException("Email already exists");
    }

    // Check for duplicate username
    const existingUserWithUsername = await this.database.user.findUnique({
      where: { username },
    });

    if (existingUserWithUsername) {
      throw new ConflictException("Username already exists");
    }

    // Validate phone number
    if (phone) {
      // Check phone number length (max 10 characters)
      if (phone.length > 10) {
        throw new BadRequestException(
          "Phone number must not exceed 10 characters",
        );
      }

      // Check for duplicate phone number
      const existingUserWithPhone = await this.database.userProfile.findFirst({
        where: { phone },
      });

      if (existingUserWithPhone) {
        throw new ConflictException("Phone number already exists");
      }
    }

    // Validate employee code
    if (employeeCode) {
      // Check for duplicate employee code
      const existingUserWithEmployeeCode =
        await this.database.userProfile.findFirst({
          where: { employeeCode },
        });

      if (existingUserWithEmployeeCode) {
        throw new ConflictException("Employee code already exists");
      }
    }

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
        profile: {
          create: {
            title: title,
            firstName: firstName || "Unknown",
            lastName: lastName || "User",
            position: "User",
            phone: phone,
            employeeCode: employeeCode,
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
      include: {
        profile: true,
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
