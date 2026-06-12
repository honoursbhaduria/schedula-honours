import { Entity, PrimaryGeneratedColumn, Column, ManyToOne } from 'typeorm';
import { DoctorProfile } from '../../users/entities/doctor-profile.entity';
import { PatientProfile } from '../../users/entities/patient-profile.entity';
import { AppointmentStatus } from '../enums/appointment-status.enum';

@Entity('appointments')
export class Appointment {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'date' })
  date: string;

  @Column({ type: 'time' })
  startTime: string;

  @Column({ type: 'time' })
  endTime: string;

  @Column({
    type: 'enum',
    enum: AppointmentStatus,
    default: AppointmentStatus.SCHEDULED,
  })
  status: AppointmentStatus;

  @ManyToOne(() => DoctorProfile)
  doctor: DoctorProfile;

  @Column()
  doctorId: number;

  @ManyToOne(() => PatientProfile)
  patient: PatientProfile;

  @Column()
  patientId: number;
}
