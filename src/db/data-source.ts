import { DataSource } from 'typeorm';
import { User } from '../modules/users/entities/user.entity';
import { DoctorProfile } from '../modules/users/entities/doctor-profile.entity';
import { PatientProfile } from '../modules/users/entities/patient-profile.entity';
import * as dotenv from 'dotenv';

dotenv.config();

export const AppDataSource = new DataSource({
  type: 'postgres',
  host: process.env.DB_HOST,
  port: parseInt(process.env.DB_PORT || '5432'),
  username: process.env.DB_USERNAME,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  synchronize: false,
  logging: true,
  entities: [User, DoctorProfile, PatientProfile],
  migrations: ['src/migrations/*.ts'],
  subscribers: [],
});
