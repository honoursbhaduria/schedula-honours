import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './modules/auth/auth.module';
import { UsersModule } from './modules/users/users.module';
import { DoctorModule } from './modules/doctor/doctor.module';
import { AiRecommendationModule } from './modules/ai-recommendation/ai-recommendation.module';
import { AppointmentModule } from './modules/appointments/appointments.module';
import { User } from './modules/users/entities/user.entity';
import { DoctorProfile } from './modules/users/entities/doctor-profile.entity';
import { PatientProfile } from './modules/users/entities/patient-profile.entity';
import { RecurringAvailability } from './modules/doctor/entities/recurring-availability.entity';
import { CustomAvailability } from './modules/doctor/entities/custom-availability.entity';
import { Appointment } from './modules/appointments/entities/appointment.entity';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        type: 'postgres',
        url: configService.get('DATABASE_URL'),
        entities: [
          User,
          DoctorProfile,
          PatientProfile,
          RecurringAvailability,
          CustomAvailability,
          Appointment,
        ],
        synchronize: false, // Set to true for development if you don't want to use migrations
        logging: true,
        ssl: configService.get('DATABASE_URL')?.includes('neon') ? { rejectUnauthorized: false } : false,
      }),
    }),
    AuthModule,
    UsersModule,
    DoctorModule,
    AiRecommendationModule,
    AppointmentModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
