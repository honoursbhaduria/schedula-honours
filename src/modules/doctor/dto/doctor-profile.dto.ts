import {
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Min,
  IsBoolean,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateDoctorProfileDto {
  @ApiProperty({ example: 'Dr. Smith' })
  @IsString()
  @IsNotEmpty()
  fullName: string;

  @ApiProperty({ example: 'Cardiology' })
  @IsString()
  @IsNotEmpty()
  specialization: string;

  @ApiProperty({ example: 10 })
  @IsNumber()
  @Min(0)
  experience: number;

  @ApiProperty({ example: 'MD, PhD' })
  @IsString()
  @IsNotEmpty()
  qualification: string;

  @ApiProperty({ example: 100 })
  @IsNumber()
  @Min(0)
  consultationFee: number;

  @ApiProperty({ example: 'Mon-Fri, 9AM-5PM' })
  @IsString()
  @IsNotEmpty()
  availability: string;

  @ApiPropertyOptional({ example: true })
  @IsBoolean()
  @IsOptional()
  isAvailable?: boolean;

  @ApiPropertyOptional({ example: 'Experienced cardiologist specialized in heart surgery.' })
  @IsString()
  @IsOptional()
  profileDetails?: string;
}

export class UpdateDoctorProfileDto {
  @ApiPropertyOptional({ example: 'Dr. Smith' })
  @IsString()
  @IsOptional()
  fullName?: string;

  @ApiPropertyOptional({ example: 'Cardiology' })
  @IsString()
  @IsOptional()
  specialization?: string;

  @ApiPropertyOptional({ example: 11 })
  @IsNumber()
  @IsOptional()
  @Min(0)
  experience?: number;

  @ApiPropertyOptional({ example: 'MD, PhD' })
  @IsString()
  @IsOptional()
  qualification?: string;

  @ApiPropertyOptional({ example: 120 })
  @IsNumber()
  @IsOptional()
  @Min(0)
  consultationFee?: number;

  @ApiPropertyOptional({ example: 'Mon-Sat, 9AM-6PM' })
  @IsString()
  @IsOptional()
  availability?: string;

  @ApiPropertyOptional({ example: true })
  @IsBoolean()
  @IsOptional()
  isAvailable?: boolean;

  @ApiPropertyOptional({ example: 'Updated profile details.' })
  @IsString()
  @IsOptional()
  profileDetails?: string;
}
