import {
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreatePatientProfileDto {
  @ApiProperty({ example: 'Jane Doe' })
  @IsString()
  @IsNotEmpty()
  fullName: string;

  @ApiProperty({ example: 25 })
  @IsNumber()
  @Min(0)
  age: number;

  @ApiProperty({ example: 'Female' })
  @IsString()
  @IsNotEmpty()
  gender: string;

  @ApiProperty({ example: '+1987654321' })
  @IsString()
  @IsNotEmpty()
  contactDetails: string;

  @ApiPropertyOptional({ example: 'No known allergies.' })
  @IsString()
  @IsOptional()
  basicHealthInfo?: string;
}

export class UpdatePatientProfileDto {
  @ApiPropertyOptional({ example: 'Jane Doe' })
  @IsString()
  @IsOptional()
  fullName?: string;

  @ApiPropertyOptional({ example: 26 })
  @IsNumber()
  @IsOptional()
  @Min(0)
  age?: number;

  @ApiPropertyOptional({ example: 'Female' })
  @IsString()
  @IsOptional()
  gender?: string;

  @ApiPropertyOptional({ example: '+1987654321' })
  @IsString()
  @IsOptional()
  contactDetails?: string;

  @ApiPropertyOptional({ example: 'Updated health info.' })
  @IsString()
  @IsOptional()
  basicHealthInfo?: string;
}
