import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { DoctorProfile } from '../users/entities/doctor-profile.entity';
import { CreateDoctorProfileDto, UpdateDoctorProfileDto } from './dto/doctor-profile.dto';

@Injectable()
export class DoctorService {
  constructor(
    @InjectRepository(DoctorProfile)
    private readonly doctorProfileRepository: Repository<DoctorProfile>,
  ) {}

  async createProfile(userId: number, dto: CreateDoctorProfileDto): Promise<DoctorProfile> {
    const existing = await this.doctorProfileRepository.findOne({ where: { userId } });
    if (existing) {
      throw new ConflictException('Doctor profile already exists');
    }

    const profile = this.doctorProfileRepository.create({
      ...dto,
      userId,
    });
    return this.doctorProfileRepository.save(profile);
  }

  async getProfile(userId: number): Promise<any> {
    const profile = await this.doctorProfileRepository.findOne({ 
      where: { userId },
      relations: { user: true } 
    });
    
    if (!profile) {
      throw new NotFoundException('Doctor profile not found');
    }

    // Explicitly returning all details as requested
    return {
      id: profile.id,
      userId: profile.userId,
      email: profile.user?.email,
      fullName: profile.fullName,
      specialization: profile.specialization,
      experience: profile.experience,
      qualification: profile.qualification,
      consultationFee: profile.consultationFee,
      availability: profile.availability,
      profileDetails: profile.profileDetails,
    };
  }

  async updateProfile(userId: number, dto: UpdateDoctorProfileDto): Promise<any> {
    const profile = await this.doctorProfileRepository.findOne({ where: { userId } });
    if (!profile) {
      throw new NotFoundException('Doctor profile not found');
    }
    
    Object.assign(profile, dto);
    await this.doctorProfileRepository.save(profile);
    return this.getProfile(userId);
  }
}
