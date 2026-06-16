import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class AiChatDto {
  @ApiProperty({
    example: 'Book an appointment with Doctor 40 for tomorrow at 10:00 AM',
    description: 'Patient message to the AI agent',
  })
  @IsString()
  @IsNotEmpty()
  message: string;

  @ApiProperty({
    example:
      'Patient has high blood pressure. Recommended doctors: [Doctor 40 (Cardiologist)]',
    description: 'Context from previous report analysis or recommendations',
    required: false,
  })
  @IsString()
  @IsOptional()
  context?: string;
}
