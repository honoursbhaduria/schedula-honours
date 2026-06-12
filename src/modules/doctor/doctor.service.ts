import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Brackets } from 'typeorm';
import { DoctorProfile } from '../users/entities/doctor-profile.entity';
import {
  CreateDoctorProfileDto,
  UpdateDoctorProfileDto,
} from './dto/doctor-profile.dto';
import { DoctorQueryDto } from './dto/doctor-query.dto';

@Injectable()
export class DoctorService {
  constructor(
    @InjectRepository(DoctorProfile)
    private readonly doctorProfileRepository: Repository<DoctorProfile>,
  ) {}

  /**
   * Professional Doctor Discovery with Fuzzy Search and Relevance Ranking.
   * Handles pagination, strict filtering, and typo-tolerant search.
   */
  async findAllDoctors(query: DoctorQueryDto) {
    const {
      search,
      specialization,
      availability,
      page = 1,
      limit = 10,
    } = query;

    // Sanitize and validate pagination inputs
    const pageNum = Math.max(1, Number(page));
    const limitNum = Math.max(1, Math.min(100, Number(limit)));
    const skip = (pageNum - 1) * limitNum;

    const queryBuilder =
      this.doctorProfileRepository.createQueryBuilder('doctor');

    // 1. Core Selection (Lean DTO for listing)
    queryBuilder.select([
      'doctor.id',
      'doctor.fullName',
      'doctor.specialization',
      'doctor.experience',
      'doctor.consultationFee',
      'doctor.isAvailable',
    ]);

    // 2. Strict Filter: Availability
    if (availability !== undefined) {
      const isAvailable = availability === 'true';
      queryBuilder.andWhere('doctor.isAvailable = :isAvailable', {
        isAvailable,
      });
    }

    // 3. Strict Filter: Specialization
    if (specialization) {
      queryBuilder.andWhere('doctor.specialization ILIKE :spec', {
        spec: `%${specialization}%`,
      });
    }

    // 4. Advanced Fuzzy Search with Relevance Ranking
    if (search) {
      const sanitizedSearch = search.trim();
      const pattern = `%${sanitizedSearch}%`;

      queryBuilder.andWhere(
        new Brackets((qb) => {
          qb.where('doctor.fullName % :search', { search: sanitizedSearch })
            .orWhere('doctor.fullName ILIKE :pattern', { pattern })
            .orWhere('doctor.specialization ILIKE :pattern', { pattern });
        }),
      );

      // Add a hidden 'score' field for ordering by similarity
      // Note: we use similarity() for ranking. This ensures 'closest' matches are first.
      queryBuilder.addSelect(`similarity(doctor.fullName, :search)`, 'score');
      queryBuilder.addOrderBy('score', 'DESC');
    } else {
      // Default stable sorting
      queryBuilder.orderBy('doctor.id', 'ASC');
    }

    // 5. Execution
    const [doctors, total] = await queryBuilder
      .skip(skip)
      .take(limitNum)
      .getManyAndCount();

    // 6. Response Construction
    return {
      data: doctors,
      meta: {
        total,
        page: pageNum,
        limit: limitNum,
        totalPages: Math.ceil(total / limitNum),
      },
    };
  }

  async findDoctorById(id: number): Promise<DoctorProfile> {
    const doctor = await this.doctorProfileRepository.findOne({
      where: { id },
      relations: { user: true },
    });

    if (!doctor) {
      throw new NotFoundException(`Doctor with ID ${id} not found`);
    }

    return doctor;
  }

  async createProfile(
    userId: number,
    dto: CreateDoctorProfileDto,
  ): Promise<DoctorProfile> {
    const existing = await this.doctorProfileRepository.findOne({
      where: { userId },
    });
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
      relations: { user: true },
    });

    if (!profile) {
      throw new NotFoundException('Doctor profile not found');
    }

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
      isAvailable: profile.isAvailable,
      profileDetails: profile.profileDetails,
    };
  }

  async updateProfile(
    userId: number,
    dto: UpdateDoctorProfileDto,
  ): Promise<any> {
    const profile = await this.doctorProfileRepository.findOne({
      where: { userId },
    });
    if (!profile) {
      throw new NotFoundException('Doctor profile not found');
    }

    Object.assign(profile, dto);
    await this.doctorProfileRepository.save(profile);
    return this.getProfile(userId);
  }
}
