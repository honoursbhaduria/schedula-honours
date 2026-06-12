import { Module } from '@nestjs/common';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { APP_GUARD, APP_INTERCEPTOR, APP_FILTER } from '@nestjs/core';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './modules/auth/auth.module';
import { UsersModule } from './modules/users/users.module';
import { DoctorModule } from './modules/doctor/doctor.module';
import { PatientModule } from './modules/patient/patient.module';
import { AiRecommendationModule } from './modules/ai-recommendation/ai-recommendation.module';
import { RoleController } from './modules/role.controller';
import { User } from './modules/users/entities/user.entity';
import { DoctorProfile } from './modules/users/entities/doctor-profile.entity';
import { PatientProfile } from './modules/users/entities/patient-profile.entity';
import { RecurringAvailability } from './modules/doctor/entities/recurring-availability.entity';
import { CustomAvailability } from './modules/doctor/entities/custom-availability.entity';
import { TransformInterceptor } from './common/interceptors/transform.interceptor';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';
import { LoggingInterceptor } from './common/interceptors/logging.interceptor';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => {
        const databaseUrl = configService.get<string>('DATABASE_URL');
        return {
          type: 'postgres',
          url: databaseUrl,
          host: !databaseUrl ? configService.get<string>('DB_HOST') : undefined,
          port: !databaseUrl ? configService.get<number>('DB_PORT') : undefined,
          username: !databaseUrl
            ? configService.get<string>('DB_USERNAME')
            : undefined,
          password: !databaseUrl
            ? configService.get<string>('DB_PASSWORD')
            : undefined,
          database: !databaseUrl
            ? configService.get<string>('DB_NAME')
            : undefined,
          entities: [
            User,
            DoctorProfile,
            PatientProfile,
            RecurringAvailability,
            CustomAvailability,
          ],
          synchronize: false,
          logging: true,
          migrations: ['dist/migrations/*.js'],
          migrationsRun: true,
          ssl: databaseUrl ? { rejectUnauthorized: false } : false,
        };
      },
      inject: [ConfigService],
    }),
    AuthModule,
    UsersModule,
    DoctorModule,
    PatientModule,
    AiRecommendationModule,
    ThrottlerModule.forRoot([
      {
        ttl: 60000,
        limit: 100,
      },
    ]),
  ],
  controllers: [AppController, RoleController],
  providers: [
    AppService,
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
    {
      provide: APP_INTERCEPTOR,
      useClass: LoggingInterceptor,
    },
    {
      provide: APP_INTERCEPTOR,
      useClass: TransformInterceptor,
    },
    {
      provide: APP_FILTER,
      useClass: HttpExceptionFilter,
    },
  ],
})
export class AppModule {}
