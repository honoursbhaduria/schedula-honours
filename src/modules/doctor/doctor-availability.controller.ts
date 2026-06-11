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
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Roles } from '../auth/roles.decorator';
import { RolesGuard } from '../auth/roles.guard';
import { Role } from '../auth/roles.enum';
import { DoctorAvailabilityService } from './doctor-availability.service';
import {
  CreateRecurringAvailabilityDto,
  UpdateRecurringAvailabilityDto,
} from './dto/availability.dto';

interface RequestWithUser {
  user: {
    userId: number;
    email: string;
    role: Role;
  };
}

@Controller('doctor/availability')
@UseGuards(JwtAuthGuard, RolesGuard)
export class DoctorAvailabilityController {
  constructor(
    private readonly availabilityService: DoctorAvailabilityService,
  ) {}

  @Post()
  @Roles(Role.DOCTOR)
  async createRecurring(
    @Req() req: RequestWithUser,
    @Body() dto: CreateRecurringAvailabilityDto,
  ) {
    return this.availabilityService.createRecurring(req.user.userId, dto);
  }

  @Get()
  @Roles(Role.DOCTOR)
  async findAllRecurring(@Req() req: RequestWithUser) {
    return this.availabilityService.findAllRecurring(req.user.userId);
  }

  @Patch(':id')
  @Roles(Role.DOCTOR)
  async updateRecurring(
    @Req() req: RequestWithUser,
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateRecurringAvailabilityDto,
  ) {
    return this.availabilityService.updateRecurring(req.user.userId, id, dto);
  }

  @Delete(':id')
  @Roles(Role.DOCTOR)
  async deleteRecurring(
    @Req() req: RequestWithUser,
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.availabilityService.deleteRecurring(req.user.userId, id);
  }

  @Post('override')
  @Roles(Role.DOCTOR)
  async createOverride(
    @Req() req: RequestWithUser,
    @Body() body: any,
  ) {
    // Manually handling to bypass whitelisting issues with nested DTOs
    const { date, slots } = body;
    return this.availabilityService.createOverride(req.user.userId, {
      date,
      slots: slots || [],
    });
  }

  @Get('date')
  @Roles(Role.DOCTOR)
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
