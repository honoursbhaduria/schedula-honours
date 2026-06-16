import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsDateString, IsEnum, IsOptional } from 'class-validator';
import { AppointmentStatus } from '../enums/appointment-status.enum';

export class AppointmentQueryDto {
  @ApiPropertyOptional({
    description: 'Filter appointments by date (YYYY-MM-DD)',
    example: '2026-06-20',
  })
  @IsOptional()
  @IsDateString()
  date?: string;

  @ApiPropertyOptional({
    description: 'Filter appointments by status',
    enum: AppointmentStatus,
  })
  @IsOptional()
  @IsEnum(AppointmentStatus)
  status?: AppointmentStatus;
}
