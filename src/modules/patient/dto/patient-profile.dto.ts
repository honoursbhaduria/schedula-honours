import {
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';

export class CreatePatientProfileDto {
  @IsString()
  @IsNotEmpty()
  fullName: string;

  @IsNumber()
  @Min(0)
  age: number;

  @IsString()
  @IsNotEmpty()
  gender: string;

  @IsString()
  @IsNotEmpty()
  contactDetails: string;

  @IsString()
  @IsOptional()
  basicHealthInfo?: string;
}

export class UpdatePatientProfileDto {
  @IsString()
  @IsOptional()
  fullName?: string;

  @IsNumber()
  @IsOptional()
  @Min(0)
  age?: number;

  @IsString()
  @IsOptional()
  gender?: string;

  @IsString()
  @IsOptional()
  contactDetails?: string;

  @IsString()
  @IsOptional()
  basicHealthInfo?: string;
}
