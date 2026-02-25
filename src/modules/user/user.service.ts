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
      firstName,
      lastName,
      employeeCode,
      phone,
      title,
    } = createUserDto;

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

    const normalizedEmail = email?.trim();
    const userEmail = normalizedEmail
      ? normalizedEmail
      : await this.generateAvailableEmailFromUsername(username);

    // Check for duplicate email
    const existingUserWithEmail = await this.database.user.findUnique({
      where: { email: userEmail },
    });

    if (existingUserWithEmail) {
      throw new ConflictException("Email already exists");
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12);

    const user = await this.database.user.create({
      data: {
        email: userEmail,
        password: hashedPassword,
        username,
        role: {
          connect: {
            id: await this.getDefaultRoleId(),
          },
        },
        profile: {
          create: {
            title: title || "Mr.",
            firstName: firstName || "-",
            lastName: lastName || "-",
            position: "User",
            phone: phone || null,
            employeeCode: employeeCode || null,
          },
        },
      },
    });

    // Remove password from response
    const { password: _, ...result } = user;
    return result;
  }

  private async generateAvailableEmailFromUsername(
    username: string,
  ): Promise<string> {
    const localPart = username
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9._-]/g, "");
    const base = localPart || "user";
    const domain = "local.user";

    let attempt = 0;
    while (attempt < 1000) {
      const email =
        attempt === 0
          ? `${base}@${domain}`
          : `${base}${attempt}@${domain}`;

      const existing = await this.database.user.findUnique({
        where: { email },
        select: { id: true },
      });

      if (!existing) {
        return email;
      }

      attempt += 1;
    }

    throw new ConflictException("Unable to generate unique email");
  }

  async findAll() {
    const users = await this.database.user.findMany({
      include: {
        profile: true,
        role: true,
      },
    });

    // Remove passwords from response and format the data
    return users.map((user) => {
      const { password, ...userWithoutPassword } = user;
      return {
        id: user.id,
        email: user.email,
        username: user.username,
        firstName: user.profile?.firstName || null,
        lastName: user.profile?.lastName || null,
        title: user.profile?.title || null,
        position: user.profile?.position || null,
        phone: user.profile?.phone || null,
        employeeCode: user.profile?.employeeCode || null,
        role: user.role?.name || null,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
      };
    });
  }

  async findOne(id: string) {
    const user = await this.database.user.findUnique({
      where: { id },
      include: {
        profile: true,
        role: true,
      },
    });

    if (!user) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }

    // Format response similar to findAll method
    const { password, ...userWithoutPassword } = user;
    return {
      id: user.id,
      email: user.email,
      username: user.username,
      firstName: user.profile?.firstName || null,
      lastName: user.profile?.lastName || null,
      title: user.profile?.title || null,
      position: user.profile?.position || null,
      phone: user.profile?.phone || null,
      employeeCode: user.profile?.employeeCode || null,
      role: user.role?.name || null,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };
  }

  async findUserWithRole(id: string) {
    const user = await this.database.user.findUnique({
      where: { id },
      include: {
        role: true,
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

  async findByUsername(username: string) {
    return this.database.user.findUnique({
      where: { username },
    });
  }

  async update(id: string, updateUserDto: UpdateUserDto) {
    const user = await this.database.user.findUnique({
      where: { id },
      include: {
        profile: true,
      },
    });

    if (!user) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }

    // Separate user data from profile data
    const { firstName, lastName, employeeCode, phone, title, ...userData } =
      updateUserDto;

    // Update user table
    const updatedUser = await this.database.user.update({
      where: { id },
      data: userData,
      select: {
        id: true,
        email: true,
        username: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    // Get updated user with profile
    const userWithProfile = await this.database.user.findUnique({
      where: { id },
      include: {
        profile: true,
        role: true,
      },
    });

    // Update user profile if profile fields are provided
    if (firstName || lastName || employeeCode || phone || title) {
      const profileUpdateData: any = {};

      if (firstName !== undefined) profileUpdateData.firstName = firstName;
      if (lastName !== undefined) profileUpdateData.lastName = lastName;
      if (employeeCode !== undefined)
        profileUpdateData.employeeCode = employeeCode;
      if (phone !== undefined) profileUpdateData.phone = phone;
      if (title !== undefined) profileUpdateData.title = title;

      // Check for duplicate phone number if phone is being updated
      if (phone && phone !== user.profile?.phone) {
        const existingUserWithPhone = await this.database.userProfile.findFirst(
          {
            where: { phone },
          },
        );

        if (existingUserWithPhone) {
          throw new ConflictException("Phone number already exists");
        }
      }

      // Check for duplicate employee code if employeeCode is being updated
      if (employeeCode && employeeCode !== user.profile?.employeeCode) {
        const existingUserWithEmployeeCode =
          await this.database.userProfile.findFirst({
            where: { employeeCode },
          });

        if (existingUserWithEmployeeCode) {
          throw new ConflictException("Employee code already exists");
        }
      }

      // Update or create profile
      if (user.profile) {
        await this.database.userProfile.update({
          where: { userId: id },
          data: profileUpdateData,
        });
      } else {
        await this.database.userProfile.create({
          data: {
            userId: id,
            firstName: firstName || "-",
            lastName: lastName || "-",
            title: title || "",
            position: "User",
            phone: phone || null,
            employeeCode: employeeCode || null,
            ...profileUpdateData,
          },
        });
      }
    }

    // Format response similar to findOne method
    if (!userWithProfile) {
      return updatedUser;
    }

    return {
      id: userWithProfile.id,
      email: userWithProfile.email,
      username: userWithProfile.username,
      firstName: userWithProfile.profile?.firstName || null,
      lastName: userWithProfile.profile?.lastName || null,
      title: userWithProfile.profile?.title || null,
      position: userWithProfile.profile?.position || null,
      phone: userWithProfile.profile?.phone || null,
      employeeCode: userWithProfile.profile?.employeeCode || null,
      role: userWithProfile.role?.name || null,
      createdAt: userWithProfile.createdAt,
      updatedAt: userWithProfile.updatedAt,
    };
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

  async setRole(id: string, roleName: string) {
    const user = await this.database.user.findUnique({
      where: { id },
    });

    if (!user) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }

    const role = await this.database.role.findFirst({
      where: { name: roleName },
    });

    if (!role) {
      throw new NotFoundException(`Role ${roleName} not found`);
    }

    await this.database.user.update({
      where: { id },
      data: {
        role: {
          connect: { id: role.id },
        },
      },
    });

    return this.findOne(id);
  }

  async resetPasswordByAdmin(id: string, newPassword: string) {
    const user = await this.database.user.findUnique({
      where: { id },
    });

    if (!user) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }

    const hashedPassword = await bcrypt.hash(newPassword, 12);

    await this.database.user.update({
      where: { id },
      data: {
        password: hashedPassword,
      },
    });

    return { message: "User password updated successfully" };
  }

  async validateUser(username: string, password: string) {
    const user = await this.findByUsername(username);
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
