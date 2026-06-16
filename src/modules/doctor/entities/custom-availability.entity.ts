import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, Index } from 'typeorm';
import { DoctorProfile } from '../../users/entities/doctor-profile.entity';

@Entity('custom_availabilities')
@Index(['doctorId', 'date'])
export class CustomAvailability {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'date' })
  date: string;

  @Column({ type: 'time', nullable: true })
  startTime: string | null;

  @Column({ type: 'time', nullable: true })
  endTime: string | null;

  @ManyToOne(() => DoctorProfile, (doctor) => doctor.customAvailabilities, {
    onDelete: 'CASCADE',
  })
  doctor: DoctorProfile;

  @Column()
  doctorId: number;
}
