import {
  Controller,
  Post,
  UseInterceptors,
  UploadedFile,
  ParseFilePipe,
  MaxFileSizeValidator,
  FileTypeValidator,
  UseGuards,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { AiRecommendationService } from './ai-recommendation.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('ai')
@UseGuards(JwtAuthGuard)
export class AiRecommendationController {
  constructor(private readonly aiRecommendationService: AiRecommendationService) {}

  @Post('recommend-doctor')
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
