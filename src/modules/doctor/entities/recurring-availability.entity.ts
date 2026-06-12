import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, Index } from 'typeorm';
import { DoctorProfile } from '../../users/entities/doctor-profile.entity';
import { DayOfWeek } from '../enums/day-of-week.enum';

@Entity('recurring_availabilities')
@Index(['doctorId', 'dayOfWeek'])
export class RecurringAvailability {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({
    type: 'enum',
    enum: DayOfWeek,
  })
  dayOfWeek: DayOfWeek;

  @Column({ type: 'time' })
  startTime: string;

  @Column({ type: 'time' })
  endTime: string;

  @ManyToOne(() => DoctorProfile, (doctor) => doctor.recurringAvailabilities, {
    onDelete: 'CASCADE',
  })
  doctor: DoctorProfile;

  @Column()
  doctorId: number;
}
