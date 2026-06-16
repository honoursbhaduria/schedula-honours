import {
  Controller,
  Post,
  Get,
  Patch,
  Body,
  Param,
  Req,
  UseGuards,
  ParseIntPipe,
  Query,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { Role } from '../auth/roles.enum';
import { AppointmentsService } from './appointments.service';
import { CreateAppointmentDto } from './dto/create-appointment.dto';
import { AppointmentQueryDto } from './dto/appointment-query.dto';

interface RequestWithUser {
  user: {
    userId: number;
    email: string;
    role: string;
  };
}

@ApiTags('4. Patient Flow (Appointment Booking)')
@ApiBearerAuth()
@Controller('appointment')
@UseGuards(JwtAuthGuard, RolesGuard)
export class AppointmentsController {
  constructor(private readonly appointmentsService: AppointmentsService) {}

  @Post()
  @Roles(Role.PATIENT)
  @ApiOperation({ summary: 'Book an appointment (Patient only)' })
  @ApiResponse({ status: 201, description: 'Appointment booked' })
  async book(@Req() req: RequestWithUser, @Body() dto: CreateAppointmentDto) {
    return this.appointmentsService.bookAppointment(req.user.userId, dto);
  }

  @Get('my')
  @Roles(Role.PATIENT)
  @ApiOperation({ summary: 'View my appointments (Patient only)' })
  @ApiResponse({ status: 200, description: 'List of appointments' })
  async getMy(
    @Req() req: RequestWithUser,
    @Query() query: AppointmentQueryDto,
  ) {
    return this.appointmentsService.getPatientAppointments(
      req.user.userId,
      query,
    );
  }

  @Patch(':id/cancel')
  @Roles(Role.PATIENT)
  @ApiOperation({ summary: 'Cancel an appointment (Patient owner only)' })
  @ApiResponse({ status: 200, description: 'Appointment cancelled' })
  async cancel(
    @Req() req: RequestWithUser,
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.appointmentsService.cancelAppointment(req.user.userId, id);
  }
}
