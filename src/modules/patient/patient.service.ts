import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PatientProfile } from '../users/entities/patient-profile.entity';
import {
  CreatePatientProfileDto,
  UpdatePatientProfileDto,
} from './dto/patient-profile.dto';

@Injectable()
export class PatientService {
  constructor(
    @InjectRepository(PatientProfile)
    private readonly patientProfileRepository: Repository<PatientProfile>,
  ) {}

  async createProfile(
    userId: number,
    dto: CreatePatientProfileDto,
  ): Promise<PatientProfile> {
    const existing = await this.patientProfileRepository.findOne({
      where: { userId },
    });
    if (existing) {
      throw new ConflictException('Patient profile already exists');
    }

    const profile = this.patientProfileRepository.create({
      ...dto,
      userId,
    });
    return this.patientProfileRepository.save(profile);
  }

  async getProfile(userId: number): Promise<any> {
    const profile = await this.patientProfileRepository.findOne({
      where: { userId },
      relations: { user: true },
    });

    if (!profile) {
      throw new NotFoundException('Patient profile not found');
    }

    // Explicitly returning all details as requested
    return {
      id: profile.id,
      userId: profile.userId,
      email: profile.user?.email,
      fullName: profile.fullName,
      age: profile.age,
      gender: profile.gender,
      contactDetails: profile.contactDetails,
      basicHealthInfo: profile.basicHealthInfo,
    };
  }

  async updateProfile(
    userId: number,
    dto: UpdatePatientProfileDto,
  ): Promise<any> {
    const profile = await this.patientProfileRepository.findOne({
      where: { userId },
    });
    if (!profile) {
      throw new NotFoundException('Patient profile not found');
    }

    Object.assign(profile, dto);
    await this.patientProfileRepository.save(profile);
    return this.getProfile(userId);
  }
}
