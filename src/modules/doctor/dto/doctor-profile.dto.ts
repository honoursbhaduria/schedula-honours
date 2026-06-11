import {
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Min,
  IsBoolean,
} from 'class-validator';

export class CreateDoctorProfileDto {
  @IsString()
  @IsNotEmpty()
  fullName: string;

  @IsString()
  @IsNotEmpty()
  specialization: string;

  @IsNumber()
  @Min(0)
  experience: number;

  @IsString()
  @IsNotEmpty()
  qualification: string;

  @IsNumber()
  @Min(0)
  consultationFee: number;

  @IsString()
  @IsNotEmpty()
  availability: string;

  @IsBoolean()
  @IsOptional()
  isAvailable?: boolean;

  @IsString()
  @IsOptional()
  profileDetails?: string;
}

export class UpdateDoctorProfileDto {
  @IsString()
  @IsOptional()
  fullName?: string;

  @IsString()
  @IsOptional()
  specialization?: string;

  @IsNumber()
  @IsOptional()
  @Min(0)
  experience?: number;

  @IsString()
  @IsOptional()
  qualification?: string;

  @IsNumber()
  @IsOptional()
  @Min(0)
  consultationFee?: number;

  @IsString()
  @IsOptional()
  availability?: string;

  @IsBoolean()
  @IsOptional()
  isAvailable?: boolean;

  @IsString()
  @IsOptional()
  profileDetails?: string;
}
