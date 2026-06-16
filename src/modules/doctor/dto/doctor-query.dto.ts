import {
  IsOptional,
  IsString,
  IsNumber,
  Min,
  IsBooleanString,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class DoctorQueryDto {
  @ApiPropertyOptional({ example: 'Smith', description: 'Search by doctor name' })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({ example: 'Cardiology', description: 'Filter by specialization' })
  @IsOptional()
  @IsString()
  specialization?: string;

  @ApiPropertyOptional({ example: 'true', description: 'Filter by availability (true/false)' })
  @IsOptional()
  @IsBooleanString()
  availability?: string;

  @ApiPropertyOptional({ example: 1, description: 'Page number' })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  page?: number = 1;

  @ApiPropertyOptional({ example: 10, description: 'Items per page' })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  limit?: number = 10;
}
