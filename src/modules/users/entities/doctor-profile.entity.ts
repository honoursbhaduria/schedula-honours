import { Entity, PrimaryGeneratedColumn, Column, OneToOne, JoinColumn } from 'typeorm';
import { User } from './user.entity';

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
  availability: string; // Consultation Hours

  @Column({ type: 'text', nullable: true })
  profileDetails: string;

  @OneToOne(() => User, (user) => user.doctorProfile)
  @JoinColumn()
  user: User;

  @Column()
  userId: number;
}
