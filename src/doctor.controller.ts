import { Controller, Get, Req, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from './auth/jwt-auth.guard';
import { Roles } from './auth/roles.decorator';
import { RolesGuard } from './auth/roles.guard';
import { Role } from './auth/roles.enum';

@Controller('doctor')
@UseGuards(JwtAuthGuard, RolesGuard)
export class DoctorController {
  @Get('profile')
  @Roles(Role.DOCTOR)
  profile(@Req() req: { user?: { email?: string; role?: Role } }) {
    return {
      message: 'Doctor profile',
      user: req.user,
    };
  }
}
