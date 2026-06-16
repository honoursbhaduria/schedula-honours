import { DataSource } from 'typeorm';
import { User } from '../modules/users/entities/user.entity';
import { DoctorProfile } from '../modules/users/entities/doctor-profile.entity';
import { PatientProfile } from '../modules/users/entities/patient-profile.entity';
import { RecurringAvailability } from '../modules/doctor/entities/recurring-availability.entity';
import { CustomAvailability } from '../modules/doctor/entities/custom-availability.entity';
import { Appointment } from '../modules/appointments/entities/appointment.entity';
import * as dotenv from 'dotenv';

dotenv.config();

const databaseUrl = process.env.DATABASE_URL;

export const AppDataSource = new DataSource({
  type: 'postgres',
  url: databaseUrl,
  host: !databaseUrl ? process.env.DB_HOST : undefined,
  port: !databaseUrl ? parseInt(process.env.DB_PORT || '5432') : undefined,
  username: !databaseUrl ? process.env.DB_USERNAME : undefined,
  password: !databaseUrl ? process.env.DB_PASSWORD : undefined,
  database: !databaseUrl ? process.env.DB_NAME : undefined,
  synchronize: false,
  logging: true,
  entities: [
    User,
    DoctorProfile,
    PatientProfile,
    RecurringAvailability,
    CustomAvailability,
    Appointment,
  ],
  migrations: ['src/migrations/*.ts'],
  subscribers: [],
  ssl: databaseUrl ? { rejectUnauthorized: false } : false,
});
