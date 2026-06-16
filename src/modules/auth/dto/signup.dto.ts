import { IsEmail, IsNotEmpty, IsString, MinLength, IsEnum, IsOptional, IsNumber, Min } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Role } from '../roles.enum';

export class SignupDto {
  @ApiProperty({ example: 'user@example.com' })
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @ApiProperty({ example: 'John Doe' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({ example: 'password123', minLength: 6 })
  @IsString()
  @MinLength(6)
  password: string;

  @ApiProperty({ enum: Role, example: Role.DOCTOR })
  @IsEnum(Role)
  role: Role;

  @ApiProperty({ example: 30, required: false })
  @IsOptional()
  @IsNumber()
  @Min(0)
  age?: number;

  @ApiProperty({ example: 'Male', required: false })
  @IsOptional()
  @IsString()
  gender?: string;

  @ApiProperty({ example: '+1234567890', required: false })
  @IsOptional()
  @IsString()
  phone?: string;

  @ApiProperty({ example: 'Cardiology', required: false, description: 'Required if role is DOCTOR' })
  @IsOptional()
  @IsString()
  specialization?: string;

  @ApiProperty({ example: 10, required: false, description: 'Required if role is DOCTOR' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  experience?: number;

  @ApiProperty({ example: 'Experienced cardiologist with 10 years of practice.', required: false })
  @IsOptional()
  @IsString()
  bio?: string;

  @ApiProperty({ example: 50, required: false, description: 'Required if role is DOCTOR' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  consultation_fee?: number;
}
