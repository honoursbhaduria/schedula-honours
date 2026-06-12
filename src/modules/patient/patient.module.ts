import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PatientController } from './patient.controller';
import { PatientService } from './patient.service';
import { PatientProfile } from '../users/entities/patient-profile.entity';

@Module({
  imports: [TypeOrmModule.forFeature([PatientProfile])],
  controllers: [PatientController],
  providers: [PatientService],
  exports: [PatientService],
})
export class PatientModule {}
