import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, OneToOne } from 'typeorm';
import { Role } from '../../auth/roles.enum';
import { DoctorProfile } from './doctor-profile.entity';
import { PatientProfile } from './patient-profile.entity';

@Entity('users')
export class User {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ unique: true })
  email: string;

  @Column()
  name: string;

  @Column()
  passwordHash: string;

  @Column({ type: 'varchar' })
  role: Role;

  @CreateDateColumn()
  createdAt: Date;

  @OneToOne(() => DoctorProfile, (profile) => profile.user)
  doctorProfile: DoctorProfile;

  @OneToOne(() => PatientProfile, (profile) => profile.user)
  patientProfile: PatientProfile;
}
