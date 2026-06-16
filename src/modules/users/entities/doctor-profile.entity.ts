import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  OneToOne,
  JoinColumn,
  OneToMany,
} from 'typeorm';
import { User } from './user.entity';
import { RecurringAvailability } from '../../doctor/entities/recurring-availability.entity';
import { CustomAvailability } from '../../doctor/entities/custom-availability.entity';
import { Appointment } from '../../appointments/entities/appointment.entity';
import { SchedulingType } from '../../doctor/enums/scheduling-type.enum';

@Entity('doctor_profiles')
export class DoctorProfile {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  fullName: string;

  @Column()
  specialization: string;

  @Column()
  experience: number;

  @Column()
  qualification: string;

  @Column()
  consultationFee: number;

  @Column({ type: 'text' })
  availability: string;

  @Column({ type: 'text', nullable: true })
  profileDetails: string;

  @Column({ default: true })
  isAvailable: boolean;

  @Column({
    type: 'enum',
    enum: SchedulingType,
    default: SchedulingType.STREAM,
  })
  schedulingType: SchedulingType;

  @Column({ default: 15 }) // in minutes
  slotDuration: number;

  @Column({ default: 0 }) // in minutes
  bufferTime: number;

  @Column({ default: 5 }) // for WAVE
  maxCapacity: number;

  @OneToOne(() => User, (user) => user.doctorProfile)
  @JoinColumn()
  user: User;

  @Column()
  userId: number;

  @OneToMany(() => RecurringAvailability, (availability) => availability.doctor)
  recurringAvailabilities: RecurringAvailability[];

  @OneToMany(() => CustomAvailability, (availability) => availability.doctor)
  customAvailabilities: CustomAvailability[];

  @OneToMany(() => Appointment, (appointment) => appointment.doctor)
  appointments: Appointment[];
}
