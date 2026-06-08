import { Controller, Get, Req, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from './auth/jwt-auth.guard';
import { Roles } from './auth/roles.decorator';
import { RolesGuard } from './auth/roles.guard';
import { Role } from './auth/roles.enum';

@Controller('patient')
@UseGuards(JwtAuthGuard, RolesGuard)
export class PatientController {
  @Get('profile')
  @Roles(Role.PATIENT)
  profile(@Req() req: { user?: { email?: string; role?: Role } }) {
    return {
      message: 'Patient profile',
      user: req.user,
    };
  }
}
