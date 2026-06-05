import { Injectable } from '@nestjs/common';
import { Role } from '../auth/roles.enum';

export interface User {
  id: number;
  email: string;
  name: string;
  passwordHash: string;
  role: Role;
  createdAt: Date;
}

export interface Patient {
  id: number;
  userId: number;
  age?: number;
  gender?: string;
  phone?: string;
}

export interface Doctor {
  id: number;
  userId: number;
  specialization?: string;
  experience?: number;
  bio?: string;
  consultation_fee?: number;
}

@Injectable()
export class UsersService {
  private users: User[] = [];
  private patients: Patient[] = [];
  private doctors: Doctor[] = [];
  
  private nextUserId = 1;
  private nextPatientId = 1;
  private nextDoctorId = 1;

  findByEmail(email: string): User | undefined {
    return this.users.find((user) => user.email === email);
  }

  create(userData: Omit<User, 'id' | 'createdAt'>): User {
    const user: User = {
      ...userData,
      id: this.nextUserId++,
      createdAt: new Date(),
    };
    this.users.push(user);
    return user;
  }

  createPatient(patientData: Omit<Patient, 'id'>): Patient {
    const patient: Patient = {
      ...patientData,
      id: this.nextPatientId++,
    };
    this.patients.push(patient);
    return patient;
  }

  createDoctor(doctorData: Omit<Doctor, 'id'>): Doctor {
    const doctor: Doctor = {
      ...doctorData,
      id: this.nextDoctorId++,
    };
    this.doctors.push(doctor);
    return doctor;
  }
}
