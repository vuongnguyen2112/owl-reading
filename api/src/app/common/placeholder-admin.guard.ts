import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class PlaceholderAdminGuard implements CanActivate {
  constructor(private readonly configService: ConfigService) {}

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<{
      headers: Record<string, string | string[] | undefined>;
    }>();
    const providedKey = request.headers['x-admin-key'];
    const adminKey = this.configService.get<string>('ADMIN_API_KEY');
    const nodeEnv = this.configService.get<string>('NODE_ENV');
    const allowPlaceholderAdmin = this.configService.get<boolean>(
      'ALLOW_PLACEHOLDER_ADMIN',
    );

    if (nodeEnv === 'production' && !allowPlaceholderAdmin) {
      throw new UnauthorizedException(
        'Placeholder admin authentication is disabled in production.',
      );
    }

    if (adminKey && providedKey === adminKey) {
      return true;
    }

    throw new UnauthorizedException('Admin API key is missing or invalid.');
  }
}
