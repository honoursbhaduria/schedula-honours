import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  OneToOne,
  JoinColumn,
} from 'typeorm';
import { User } from './user.entity';

@Entity('patient_profiles')
export class PatientProfile {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  fullName: string;

  @Column()
  age: number;

  @Column()
  gender: string;

  @Column()
  contactDetails: string;

  @Column({ type: 'text', nullable: true })
  basicHealthInfo: string;

  @OneToOne(() => User, (user) => user.patientProfile)
  @JoinColumn()
  user: User;

  @Column()
  userId: number;
}
