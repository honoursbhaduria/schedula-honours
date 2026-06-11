import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Req,
  UseGuards,
  Query,
  Param,
  ParseIntPipe,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Roles } from '../auth/roles.decorator';
import { RolesGuard } from '../auth/roles.guard';
import { Role } from '../auth/roles.enum';
import { DoctorService } from './doctor.service';
import {
  CreateDoctorProfileDto,
  UpdateDoctorProfileDto,
} from './dto/doctor-profile.dto';
import { DoctorQueryDto } from './dto/doctor-query.dto';

@Controller('doctor')
@UseGuards(JwtAuthGuard, RolesGuard)
export class DoctorController {
  constructor(private readonly doctorService: DoctorService) {}

  @Get()
  @Roles(Role.PATIENT, Role.DOCTOR)
  async findAll(@Query() query: DoctorQueryDto) {
    return this.doctorService.findAllDoctors(query);
  }

  @Post('profile')
  @Roles(Role.DOCTOR)
  async createProfile(@Req() req: any, @Body() dto: CreateDoctorProfileDto) {
    return this.doctorService.createProfile(req.user.userId, dto);
  }

  @Get('profile')
  @Roles(Role.DOCTOR)
  async getProfile(@Req() req: any) {
    return this.doctorService.getProfile(req.user.userId);
  }

  @Patch('profile')
  @Roles(Role.DOCTOR)
  async updateProfile(@Req() req: any, @Body() dto: UpdateDoctorProfileDto) {
    return this.doctorService.updateProfile(req.user.userId, dto);
  }

  @Get(':id')
  @Roles(Role.PATIENT, Role.DOCTOR)
  async findOne(@Param('id', ParseIntPipe) id: number) {
    return this.doctorService.findDoctorById(id);
  }
}
