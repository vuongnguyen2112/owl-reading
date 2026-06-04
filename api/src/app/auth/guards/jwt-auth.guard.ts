import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { UserRole } from '@prisma/client';
import { AuthenticatedRequest } from '../auth.types';
import { JwtService } from '../jwt.service';

@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(
    private readonly configService: ConfigService,
    private readonly jwtService: JwtService,
  ) {}

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const authorization = request.headers.authorization;
    const value = Array.isArray(authorization)
      ? authorization[0]
      : authorization;
    const token = value?.startsWith('Bearer ') ? value.slice(7) : '';
    const payload = this.jwtService.verify(
      token,
      this.configService.getOrThrow<string>('JWT_ACCESS_SECRET'),
      'access',
    );

    request.user = {
      sub: payload.sub,
      email: payload.email,
      role: payload.role as UserRole,
    };

    return true;
  }
}
