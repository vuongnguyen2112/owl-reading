import { Injectable, UnauthorizedException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../database/prisma.service';
import { UpdateUserProfileDto } from './dto/update-user-profile.dto';
import {
  UserProfileResponseDto,
  toUserProfileResponseDto,
} from './dto/user-profile-response.dto';

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  async getCurrentProfile(userId: string): Promise<UserProfileResponseDto> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new UnauthorizedException('User no longer exists.');
    }

    return toUserProfileResponseDto(user);
  }

  async updateCurrentProfile(
    userId: string,
    dto: UpdateUserProfileDto,
  ): Promise<UserProfileResponseDto> {
    try {
      const user = await this.prisma.user.update({
        where: { id: userId },
        data: {
          displayName:
            dto.displayName === undefined
              ? undefined
              : dto.displayName?.trim() || null,
        },
      });

      return toUserProfileResponseDto(user);
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2025'
      ) {
        throw new UnauthorizedException('User no longer exists.');
      }

      throw error;
    }
  }
}
