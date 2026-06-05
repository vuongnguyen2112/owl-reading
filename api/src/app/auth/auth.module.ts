import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ThrottlerModule } from '@nestjs/throttler';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { RolesGuard } from './guards/roles.guard';
import { JwtService } from './jwt.service';
import { PasswordService } from './password.service';

@Module({
  imports: [
    ThrottlerModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        throttlers: [
          {
            name: 'login',
            ttl:
              configService.getOrThrow<number>(
                'AUTH_LOGIN_RATE_LIMIT_TTL_SECONDS',
              ) * 1000,
            limit: configService.getOrThrow<number>(
              'AUTH_LOGIN_RATE_LIMIT_MAX',
            ),
          },
          {
            name: 'register',
            ttl:
              configService.getOrThrow<number>(
                'AUTH_REGISTER_RATE_LIMIT_TTL_SECONDS',
              ) * 1000,
            limit: configService.getOrThrow<number>(
              'AUTH_REGISTER_RATE_LIMIT_MAX',
            ),
          },
          {
            name: 'refresh',
            ttl:
              configService.getOrThrow<number>(
                'AUTH_REFRESH_RATE_LIMIT_TTL_SECONDS',
              ) * 1000,
            limit: configService.getOrThrow<number>(
              'AUTH_REFRESH_RATE_LIMIT_MAX',
            ),
          },
        ],
      }),
    }),
  ],
  controllers: [AuthController],
  providers: [
    AuthService,
    JwtService,
    JwtAuthGuard,
    PasswordService,
    RolesGuard,
  ],
  exports: [JwtAuthGuard, JwtService, PasswordService, RolesGuard],
})
export class AuthModule {}
