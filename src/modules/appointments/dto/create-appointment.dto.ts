import { ApiProperty } from '@nestjs/swagger';
import {
  IsDateString,
  IsInt,
  IsNotEmpty,
  IsString,
  Matches,
} from 'class-validator';

export class CreateAppointmentDto {
  @ApiProperty({ example: 40, description: 'ID of the doctor' })
  @IsInt()
  @IsNotEmpty()
  doctorId: number;

  @ApiProperty({
    example: '2026-06-20',
    description: 'Date of the appointment (YYYY-MM-DD)',
  })
  @IsDateString()
  @IsNotEmpty()
  date: string;

  @ApiProperty({
    example: '10:00',
    description: 'Start time of the appointment (HH:MM)',
  })
  @IsString()
  @IsNotEmpty()
  @Matches(/^([01]\d|2[0-3]):?([0-5]\d)$/, {
    message: 'startTime must be in HH:MM format',
  })
  startTime: string;

  @ApiProperty({
    example: '10:30',
    description: 'End time of the appointment (HH:MM)',
  })
  @IsString()
  @IsNotEmpty()
  @Matches(/^([01]\d|2[0-3]):?([0-5]\d)$/, {
    message: 'endTime must be in HH:MM format',
  })
  endTime: string;
}
