import {
  Body,
  Controller,
  Get,
  Post,
  Req,
  Res,
  UnauthorizedException,
  UseGuards,
} from '@nestjs/common';
import { ApiOkResponse, ApiTags } from '@nestjs/swagger';
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
  };
}

interface CookieResponse {
  cookie(name: string, value: string, options: object): void;
  clearCookie(name: string, options: object): void;
}

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  @ApiOkResponse({ type: AuthResponseDto })
  async register(
    @Body() dto: RegisterDto,
    @Res({ passthrough: true }) response: CookieResponse,
  ): Promise<AuthResponseDto> {
    const result = await this.authService.register(dto);
    this.setRefreshCookie(response, result.refreshToken);

    return {
      user: result.user,
      accessToken: result.accessToken,
    };
  }

  @Post('login')
  @ApiOkResponse({ type: AuthResponseDto })
  async login(
    @Body() dto: LoginDto,
    @Res({ passthrough: true }) response: CookieResponse,
  ): Promise<AuthResponseDto> {
    const result = await this.authService.login(dto);
    this.setRefreshCookie(response, result.refreshToken);

    return {
      user: result.user,
      accessToken: result.accessToken,
    };
  }

  @Post('refresh')
  @ApiOkResponse({ type: AuthResponseDto })
  async refresh(
    @Req() request: CookieRequest,
    @Res({ passthrough: true }) response: CookieResponse,
  ): Promise<AuthResponseDto> {
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
}
