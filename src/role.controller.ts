import { Controller, Get, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from './auth/jwt-auth.guard';
import { Roles } from './auth/roles.decorator';
import { RolesGuard } from './auth/roles.guard';
import { Role } from './auth/roles.enum';

@Controller('role')
@UseGuards(JwtAuthGuard, RolesGuard)
export class RoleController {
  @Get('doctor')
  @Roles(Role.DOCTOR)
  doctorOnly() {
    return { message: 'Access granted: Doctor' };
  }

  @Get('patient')
  @Roles(Role.PATIENT)
  patientOnly() {
    return { message: 'Access granted: Patient' };
  }

  @Get('admin')
  @Roles(Role.ADMIN)
  adminOnly() {
    return { message: 'Access granted: Admin' };
  }
}
