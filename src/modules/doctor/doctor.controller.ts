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
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Roles } from '../auth/roles.decorator';
import { RolesGuard } from '../auth/roles.guard';
import { Role } from '../auth/roles.enum';
import { DoctorService } from './doctor.service';
import { DoctorAvailabilityService } from './doctor-availability.service';
import {
  CreateDoctorProfileDto,
  UpdateDoctorProfileDto,
} from './dto/doctor-profile.dto';
import { DoctorQueryDto } from './dto/doctor-query.dto';

@ApiTags('Doctor Management')
@ApiBearerAuth()
@Controller('doctor')
@UseGuards(JwtAuthGuard, RolesGuard)
export class DoctorController {
  constructor(
    private readonly doctorService: DoctorService,
    private readonly availabilityService: DoctorAvailabilityService,
  ) {}

  @Get()
  @Roles(Role.PATIENT, Role.DOCTOR)
  @ApiOperation({ summary: 'Discover doctors with filters and fuzzy search' })
  @ApiResponse({ status: 200, description: 'List of doctors found' })
  async findAll(@Query() query: DoctorQueryDto) {
    return this.doctorService.findAllDoctors(query);
  }

  @Post('profile')
  @Roles(Role.DOCTOR)
  @ApiOperation({ summary: 'Create doctor profile (Doctor only)' })
  @ApiResponse({ status: 201, description: 'Profile created' })
  async createProfile(@Req() req: any, @Body() dto: CreateDoctorProfileDto) {
    return this.doctorService.createProfile(req.user.userId, dto);
  }

  @Get('profile')
  @Roles(Role.DOCTOR)
  @ApiOperation({ summary: 'Get current doctor profile (Doctor only)' })
  @ApiResponse({ status: 200, description: 'Profile found' })
  async getProfile(@Req() req: any) {
    return this.doctorService.getProfile(req.user.userId);
  }

  @Patch('profile')
  @Roles(Role.DOCTOR)
  @ApiOperation({ summary: 'Update current doctor profile (Doctor only)' })
  @ApiResponse({ status: 200, description: 'Profile updated' })
  async updateProfile(@Req() req: any, @Body() dto: UpdateDoctorProfileDto) {
    return this.doctorService.updateProfile(req.user.userId, dto);
  }

  @Get(':id/slots')
  @Roles(Role.PATIENT, Role.DOCTOR)
  @ApiOperation({ summary: 'Fetch available slots for a doctor on a specific date' })
  @ApiQuery({ name: 'date', example: '2026-06-20', description: 'YYYY-MM-DD' })
  @ApiQuery({ name: 'duration', example: 30, required: false, enum: [10, 15, 30, 60] })
  @ApiResponse({ status: 200, description: 'List of available slots' })
  async getSlots(
    @Param('id', ParseIntPipe) id: number,
    @Query('date') date: string,
    @Query('duration') duration?: number,
  ) {
    return this.availabilityService.getAvailableSlots(id, date, duration);
  }

  @Get(':id')
  @Roles(Role.PATIENT, Role.DOCTOR)
  @ApiOperation({ summary: 'Get doctor by ID' })
  @ApiResponse({ status: 200, description: 'Doctor found' })
  @ApiResponse({ status: 404, description: 'Doctor not found' })
  async findOne(@Param('id', ParseIntPipe) id: number) {
    return this.doctorService.findDoctorById(id);
  }
}
