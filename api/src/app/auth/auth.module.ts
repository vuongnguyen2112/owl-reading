import { Module } from '@nestjs/common';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { RolesGuard } from './guards/roles.guard';
import { JwtService } from './jwt.service';
import { PasswordService } from './password.service';

@Module({
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
