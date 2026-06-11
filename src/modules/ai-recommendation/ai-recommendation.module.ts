import { Module } from '@nestjs/common';
import { AiRecommendationController } from './ai-recommendation.controller';
import { AiRecommendationService } from './ai-recommendation.service';
import { DoctorModule } from '../doctor/doctor.module';

@Module({
  imports: [DoctorModule],
  controllers: [AiRecommendationController],
  providers: [AiRecommendationService],
})
export class AiRecommendationModule {}
