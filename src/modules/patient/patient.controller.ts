import { Controller, Get, Post, Patch, Body, Req, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Roles } from '../auth/roles.decorator';
import { RolesGuard } from '../auth/roles.guard';
import { Role } from '../auth/roles.enum';
import { PatientService } from './patient.service';
import { CreatePatientProfileDto, UpdatePatientProfileDto } from './dto/patient-profile.dto';

@Controller('patient')
@UseGuards(JwtAuthGuard, RolesGuard)
export class PatientController {
  constructor(private readonly patientService: PatientService) {}

  @Post('profile')
  @Roles(Role.PATIENT)
  async createProfile(@Req() req: any, @Body() dto: CreatePatientProfileDto) {
    return this.patientService.createProfile(req.user.userId, dto);
  }

  @Get('profile')
  @Roles(Role.PATIENT)
  async getProfile(@Req() req: any) {
    return this.patientService.getProfile(req.user.userId);
  }

  @Patch('profile')
  @Roles(Role.PATIENT)
  async updateProfile(@Req() req: any, @Body() dto: UpdatePatientProfileDto) {
    return this.patientService.updateProfile(req.user.userId, dto);
  }
}
