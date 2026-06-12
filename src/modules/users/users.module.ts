import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from './entities/user.entity';
import { DoctorProfile } from './entities/doctor-profile.entity';
import { PatientProfile } from './entities/patient-profile.entity';
import { UsersService } from './users.service';

@Module({
  imports: [TypeOrmModule.forFeature([User, DoctorProfile, PatientProfile])],
  providers: [UsersService],
  exports: [UsersService, TypeOrmModule],
})
export class UsersModule {}
