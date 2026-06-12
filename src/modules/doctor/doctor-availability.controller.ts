import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
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
import { DoctorAvailabilityService } from './doctor-availability.service';
import {
  CreateRecurringAvailabilityDto,
  UpdateRecurringAvailabilityDto,
  CreateCustomAvailabilityOverrideDto,
} from './dto/availability.dto';

interface RequestWithUser {
  user: {
    userId: number;
    email: string;
    role: Role;
  };
}

@ApiTags('Doctor Availability')
@ApiBearerAuth()
@Controller('doctor/availability')
@UseGuards(JwtAuthGuard, RolesGuard)
export class DoctorAvailabilityController {
  constructor(
    private readonly availabilityService: DoctorAvailabilityService,
  ) {}

  @Post()
  @Roles(Role.DOCTOR)
  @ApiOperation({ summary: 'Set recurring availability for a day of week (Doctor only)' })
  @ApiResponse({ status: 201, description: 'Recurring availability set' })
  async createRecurring(
    @Req() req: RequestWithUser,
    @Body() dto: CreateRecurringAvailabilityDto,
  ) {
    return this.availabilityService.createRecurring(req.user.userId, dto);
  }

  @Get()
  @Roles(Role.DOCTOR)
  @ApiOperation({ summary: 'Get all recurring availabilities (Doctor only)' })
  @ApiResponse({ status: 200, description: 'List of recurring availabilities' })
  async findAllRecurring(@Req() req: RequestWithUser) {
    return this.availabilityService.findAllRecurring(req.user.userId);
  }

  @Patch(':id')
  @Roles(Role.DOCTOR)
  @ApiOperation({ summary: 'Update recurring availability (Doctor only)' })
  @ApiResponse({ status: 200, description: 'Availability updated' })
  async updateRecurring(
    @Req() req: RequestWithUser,
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateRecurringAvailabilityDto,
  ) {
    return this.availabilityService.updateRecurring(req.user.userId, id, dto);
  }

  @Delete(':id')
  @Roles(Role.DOCTOR)
  @ApiOperation({ summary: 'Delete recurring availability (Doctor only)' })
  @ApiResponse({ status: 200, description: 'Availability deleted' })
  async deleteRecurring(
    @Req() req: RequestWithUser,
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.availabilityService.deleteRecurring(req.user.userId, id);
  }

  @Post('override')
  @Roles(Role.DOCTOR)
  @ApiOperation({ summary: 'Set custom availability override for a specific date (Doctor only)' })
  @ApiResponse({ status: 201, description: 'Override set' })
  async createOverride(
    @Req() req: RequestWithUser,
    @Body() dto: CreateCustomAvailabilityOverrideDto,
  ) {
    return this.availabilityService.createOverride(req.user.userId, dto);
  }

  @Get('date')
  @Roles(Role.DOCTOR)
  @ApiOperation({ summary: 'Get availability for a specific date (Doctor only)' })
  @ApiQuery({ name: 'date', example: '2026-06-20' })
  @ApiResponse({ status: 200, description: 'Availability for date' })
  async getAvailabilityByDate(
    @Req() req: RequestWithUser,
    @Query('date') date: string,
  ) {
    return this.availabilityService.getAvailabilityForDate(
      req.user.userId,
      date,
    );
  }
}
