import {
  Body,
  Controller,
  ForbiddenException,
  Get,
  Post,
  Req,
  Res,
  UnauthorizedException,
  UseGuards,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ApiOkResponse, ApiTags } from '@nestjs/swagger';
import { SkipThrottle, ThrottlerGuard } from '@nestjs/throttler';
import { CurrentUser } from './decorators/current-user.decorator';
import { AuthResponseDto, AuthUserResponseDto } from './dto/auth-response.dto';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { AuthenticatedUser } from './auth.types';
import { AuthService } from './auth.service';

const refreshCookieName = 'owl_refresh_token';

interface CookieRequest {
  headers: {
    cookie?: string;
    origin?: string;
    referer?: string;
    referrer?: string;
  };
}

interface CookieResponse {
  cookie(name: string, value: string, options: object): void;
  clearCookie(name: string, options: object): void;
}

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly configService: ConfigService,
  ) {}

  @Post('register')
  @UseGuards(ThrottlerGuard)
  @SkipThrottle({ login: true, refresh: true })
  @ApiOkResponse({ type: AuthResponseDto })
  async register(
    @Req() request: CookieRequest,
    @Body() dto: RegisterDto,
    @Res({ passthrough: true }) response: CookieResponse,
  ): Promise<AuthResponseDto> {
    this.assertAllowedCookieBackedAuthSource(request);
    const result = await this.authService.register(dto);
    this.setRefreshCookie(response, result.refreshToken);

    return {
      user: result.user,
      accessToken: result.accessToken,
    };
  }

  @Post('login')
  @UseGuards(ThrottlerGuard)
  @SkipThrottle({ register: true, refresh: true })
  @ApiOkResponse({ type: AuthResponseDto })
  async login(
    @Req() request: CookieRequest,
    @Body() dto: LoginDto,
    @Res({ passthrough: true }) response: CookieResponse,
  ): Promise<AuthResponseDto> {
    this.assertAllowedCookieBackedAuthSource(request);
    const result = await this.authService.login(dto);
    this.setRefreshCookie(response, result.refreshToken);

    return {
      user: result.user,
      accessToken: result.accessToken,
    };
  }

  @Post('refresh')
  @UseGuards(ThrottlerGuard)
  @SkipThrottle({ login: true, register: true })
  @ApiOkResponse({ type: AuthResponseDto })
  async refresh(
    @Req() request: CookieRequest,
    @Res({ passthrough: true }) response: CookieResponse,
  ): Promise<AuthResponseDto> {
    this.assertAllowedCookieBackedAuthSource(request);
    const result = await this.authService.refresh(
      this.getRefreshCookie(request),
    );
    this.setRefreshCookie(response, result.refreshToken);

    return {
      user: result.user,
      accessToken: result.accessToken,
    };
  }

  @Post('logout')
  async logout(
    @Req() request: CookieRequest,
    @Res({ passthrough: true }) response: CookieResponse,
  ): Promise<{ success: true }> {
    this.assertAllowedCookieBackedAuthSource(request);
    await this.authService.logout(this.getOptionalRefreshCookie(request));
    response.clearCookie(refreshCookieName, {
      path: '/api/auth',
    });

    return { success: true };
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  @ApiOkResponse({ type: AuthUserResponseDto })
  me(@CurrentUser() user: AuthenticatedUser): Promise<AuthUserResponseDto> {
    return this.authService.getCurrentUser(user.sub);
  }

  private setRefreshCookie(response: CookieResponse, token: string): void {
    response.cookie(
      refreshCookieName,
      token,
      this.authService.getRefreshCookieOptions(),
    );
  }

  private getRefreshCookie(request: CookieRequest): string {
    const token = this.getOptionalRefreshCookie(request);

    if (!token) {
      throw new UnauthorizedException('Refresh token cookie is missing.');
    }

    return token;
  }

  private getOptionalRefreshCookie(request: CookieRequest): string | undefined {
    return request.headers.cookie
      ?.split(';')
      .map((cookie) => cookie.trim())
      .find((cookie) => cookie.startsWith(`${refreshCookieName}=`))
      ?.slice(refreshCookieName.length + 1);
  }

  private assertAllowedCookieBackedAuthSource(request: CookieRequest): void {
    const sourceOrigin = this.getRequestSourceOrigin(request);

    if (!sourceOrigin || !this.getAllowedOrigins().has(sourceOrigin)) {
      throw new ForbiddenException('Request origin is not allowed.');
    }
  }

  private getRequestSourceOrigin(request: CookieRequest): string | null {
    const origin = request.headers.origin;

    if (origin) {
      return this.toOrigin(origin);
    }

    const referer = request.headers.referer ?? request.headers.referrer;

    if (referer) {
      return this.toOrigin(referer);
    }

    return null;
  }

  private getAllowedOrigins(): Set<string> {
    return new Set(
      this.configService
        .getOrThrow<string>('CORS_ORIGINS')
        .split(',')
        .map((origin) => this.toOrigin(origin.trim()))
        .filter((origin): origin is string => Boolean(origin)),
    );
  }

  private toOrigin(value: string): string | null {
    try {
      return new URL(value).origin;
    } catch {
      return null;
    }
  }
}
