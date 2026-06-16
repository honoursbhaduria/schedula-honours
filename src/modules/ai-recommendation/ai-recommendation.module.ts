import { Module } from '@nestjs/common';
import { AiRecommendationController } from './ai-recommendation.controller';
import { AiRecommendationService } from './ai-recommendation.service';
import { DoctorModule } from '../doctor/doctor.module';
import { AppointmentModule } from '../appointments/appointments.module';
import { PatientModule } from '../patient/patient.module';

@Module({
  imports: [DoctorModule, AppointmentModule, PatientModule],
  controllers: [AiRecommendationController],
  providers: [AiRecommendationService],
})
export class AiRecommendationModule {}
