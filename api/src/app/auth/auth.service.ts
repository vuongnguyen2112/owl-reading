import {
  ConflictException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Prisma, User, UserRole } from '@prisma/client';
import { createHash } from 'node:crypto';
import { PrismaService } from '../database/prisma.service';
import { AuthResponseDto, AuthUserResponseDto } from './dto/auth-response.dto';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { JwtPayload, JwtService } from './jwt.service';
import { PasswordService } from './password.service';

@Injectable()
export class AuthService {
  constructor(
    private readonly configService: ConfigService,
    private readonly jwtService: JwtService,
    private readonly passwordService: PasswordService,
    private readonly prisma: PrismaService,
  ) {}

  async register(dto: RegisterDto): Promise<AuthResponseDto & { refreshToken: string }> {
    const email = this.normalizeEmail(dto.email);
    const passwordHash = await this.passwordService.hash(dto.password);

    try {
      const user = await this.prisma.user.create({
        data: {
          email,
          passwordHash,
          displayName: dto.displayName?.trim() || null,
        },
      });

      return this.createAuthSession(user);
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2002'
      ) {
        throw new ConflictException('Email is already registered.');
      }

      throw error;
    }
  }

  async login(dto: LoginDto): Promise<AuthResponseDto & { refreshToken: string }> {
    const user = await this.prisma.user.findUnique({
      where: { email: this.normalizeEmail(dto.email) },
    });

    if (
      !user ||
      !(await this.passwordService.verify(dto.password, user.passwordHash))
    ) {
      throw new UnauthorizedException('Email or password is invalid.');
    }

    return this.createAuthSession(user);
  }

  async refresh(refreshToken: string): Promise<AuthResponseDto & { refreshToken: string }> {
    const payload = this.verifyRefreshToken(refreshToken);

    if (!payload.jti) {
      throw new UnauthorizedException('Refresh token is invalid.');
    }

    const storedToken = await this.prisma.refreshToken.findUnique({
      where: { id: payload.jti },
      include: { user: true },
    });

    if (
      !storedToken ||
      storedToken.revokedAt ||
      storedToken.expiresAt <= new Date() ||
      storedToken.tokenHash !== this.hashToken(refreshToken)
    ) {
      throw new UnauthorizedException('Refresh token is invalid.');
    }

    const accessToken = this.signAccessToken(storedToken.user);
    const nextRefreshToken = this.signRefreshToken(storedToken.user, storedToken.id);

    await this.prisma.refreshToken.update({
      where: { id: storedToken.id },
      data: {
        tokenHash: this.hashToken(nextRefreshToken),
        expiresAt: this.getRefreshExpiresAt(),
      },
    });

    return {
      user: this.toAuthUser(storedToken.user),
      accessToken,
      refreshToken: nextRefreshToken,
    };
  }

  async logout(refreshToken?: string): Promise<void> {
    if (!refreshToken) {
      return;
    }

    try {
      const payload = this.verifyRefreshToken(refreshToken);

      if (payload.jti) {
        await this.prisma.refreshToken.updateMany({
          where: { id: payload.jti, tokenHash: this.hashToken(refreshToken) },
          data: { revokedAt: new Date() },
        });
      }
    } catch {
      return;
    }
  }

  async getCurrentUser(userId: string): Promise<AuthUserResponseDto> {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });

    if (!user) {
      throw new UnauthorizedException('User no longer exists.');
    }

    return this.toAuthUser(user);
  }

  getRefreshCookieOptions() {
    const ttlDays = this.configService.getOrThrow<number>('JWT_REFRESH_TTL_DAYS');

    return {
      httpOnly: true,
      secure: this.configService.getOrThrow<boolean>('AUTH_COOKIE_SECURE'),
      sameSite: this.configService.getOrThrow<'strict' | 'lax' | 'none'>(
        'AUTH_COOKIE_SAMESITE',
      ),
      path: '/api/auth',
      maxAge: ttlDays * 24 * 60 * 60 * 1000,
    } as const;
  }

  private async createAuthSession(
    user: User,
  ): Promise<AuthResponseDto & { refreshToken: string }> {
    const session = await this.prisma.refreshToken.create({
      data: {
        userId: user.id,
        tokenHash: '',
        expiresAt: this.getRefreshExpiresAt(),
      },
    });
    const refreshToken = this.signRefreshToken(user, session.id);

    await this.prisma.refreshToken.update({
      where: { id: session.id },
      data: { tokenHash: this.hashToken(refreshToken) },
    });

    return {
      user: this.toAuthUser(user),
      accessToken: this.signAccessToken(user),
      refreshToken,
    };
  }

  private signAccessToken(user: User): string {
    return this.jwtService.sign(
      {
        sub: user.id,
        email: user.email,
        role: user.role,
        typ: 'access',
      },
      this.configService.getOrThrow<string>('JWT_ACCESS_SECRET'),
      this.configService.getOrThrow<number>('JWT_ACCESS_TTL_SECONDS'),
    );
  }

  private signRefreshToken(user: User, tokenId: string): string {
    return this.jwtService.sign(
      {
        sub: user.id,
        email: user.email,
        role: user.role,
        typ: 'refresh',
        jti: tokenId,
      },
      this.configService.getOrThrow<string>('JWT_REFRESH_SECRET'),
      this.configService.getOrThrow<number>('JWT_REFRESH_TTL_DAYS') *
        24 *
        60 *
        60,
    );
  }

  private verifyRefreshToken(token: string): JwtPayload {
    return this.jwtService.verify(
      token,
      this.configService.getOrThrow<string>('JWT_REFRESH_SECRET'),
      'refresh',
    );
  }

  private getRefreshExpiresAt(): Date {
    return new Date(
      Date.now() +
        this.configService.getOrThrow<number>('JWT_REFRESH_TTL_DAYS') *
          24 *
          60 *
          60 *
          1000,
    );
  }

  private hashToken(token: string): string {
    return createHash('sha256').update(token).digest('base64url');
  }

  private normalizeEmail(email: string): string {
    return email.trim().toLowerCase();
  }

  private toAuthUser(user: User): AuthUserResponseDto {
    return {
      id: user.id,
      email: user.email,
      displayName: user.displayName,
      role: user.role as UserRole,
    };
  }
}
