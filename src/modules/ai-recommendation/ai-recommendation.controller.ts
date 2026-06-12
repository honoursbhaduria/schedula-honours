import {
  Controller,
  Post,
  UseInterceptors,
  UploadedFile,
  UseGuards,
  ParseFilePipe,
  MaxFileSizeValidator,
  FileTypeValidator,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiConsumes, ApiBody } from '@nestjs/swagger';
import { FileInterceptor } from '@nestjs/platform-express';
import { AiRecommendationService } from './ai-recommendation.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@ApiTags('AI Recommendation')
@ApiBearerAuth()
@Controller('ai')
@UseGuards(JwtAuthGuard)
export class AiRecommendationController {
  constructor(private readonly aiRecommendationService: AiRecommendationService) {}

  @Post('recommend-doctor')
  @ApiOperation({ summary: 'Upload medical report and get AI doctor recommendation' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        report: {
          type: 'string',
          format: 'binary',
          description: 'Medical report file (PDF, JPG, PNG)',
        },
      },
    },
  })
  @ApiResponse({ status: 200, description: 'AI analysis and recommended doctors' })
  @ApiResponse({ status: 500, description: 'AI processing error' })
  @UseInterceptors(FileInterceptor('report'))
  async recommendDoctor(
    @UploadedFile(
      new ParseFilePipe({
        validators: [
          new MaxFileSizeValidator({ maxSize: 10 * 1024 * 1024 }),
          new FileTypeValidator({ fileType: 'pdf|jpg|jpeg|png' }),
        ],
      }),
    )
    file: Express.Multer.File,
  ) {
    return this.aiRecommendationService.recommendDoctor(file);
  }
}
