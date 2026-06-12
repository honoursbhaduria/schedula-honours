import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { NotFoundException, ConflictException } from '@nestjs/common';
import { DoctorService } from './doctor.service';
import { DoctorProfile } from '../users/entities/doctor-profile.entity';
import { Repository, Brackets } from 'typeorm';

describe('DoctorService', () => {
  let service: DoctorService;
  let repository: Repository<DoctorProfile>;

  const mockDoctorProfile = {
    id: 1,
    fullName: 'Dr. Honours Bhadauria',
    specialization: 'Cardiologist',
    experience: 10,
    consultationFee: 500,
    isAvailable: true,
    userId: 1,
    user: { id: 1, email: 'honours@example.com' },
  };

  const mockQueryBuilder: any = {
    select: jest.fn().mockReturnThis(),
    addSelect: jest.fn().mockReturnThis(),
    andWhere: jest.fn().mockReturnThis(),
    where: jest.fn().mockReturnThis(),
    orWhere: jest.fn().mockReturnThis(),
    orderBy: jest.fn().mockReturnThis(),
    addOrderBy: jest.fn().mockReturnThis(),
    skip: jest.fn().mockReturnThis(),
    take: jest.fn().mockReturnThis(),
    getManyAndCount: jest.fn().mockResolvedValue([[mockDoctorProfile], 1]),
  };

  const mockRepository = {
    createQueryBuilder: jest.fn().mockReturnValue(mockQueryBuilder),
    findOne: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DoctorService,
        {
          provide: getRepositoryToken(DoctorProfile),
          useValue: mockRepository,
        },
      ],
    }).compile();

    service = module.get<DoctorService>(DoctorService);
    repository = module.get<Repository<DoctorProfile>>(
      getRepositoryToken(DoctorProfile),
    );

    // Reset all mocks
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('findAllDoctors', () => {
    it('should return paginated doctors with default values', async () => {
      const result = await service.findAllDoctors({});

      expect(result.data).toEqual([mockDoctorProfile]);
      expect(result.meta.page).toBe(1);
      expect(result.meta.limit).toBe(10);
      expect(mockRepository.createQueryBuilder).toHaveBeenCalledWith('doctor');
      expect(mockQueryBuilder.select).toHaveBeenCalled();
      expect(mockQueryBuilder.skip).toHaveBeenCalledWith(0);
      expect(mockQueryBuilder.take).toHaveBeenCalledWith(10);
    });

    it('should apply strict availability filter', async () => {
      await service.findAllDoctors({ availability: 'true' });
      expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith(
        'doctor.isAvailable = :isAvailable',
        { isAvailable: true },
      );
    });

    it('should apply strict specialization filter', async () => {
      await service.findAllDoctors({ specialization: 'Cardiology' });
      expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith(
        'doctor.specialization ILIKE :spec',
        { spec: '%Cardiology%' },
      );
    });

    it('should apply advanced fuzzy search and ranking when search query is provided', async () => {
      await service.findAllDoctors({ search: 'hono' });

      // Verify Brackets was used for fuzzy logic
      expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith(
        expect.any(Brackets),
      );

      // Verify similarity select for ranking
      expect(mockQueryBuilder.addSelect).toHaveBeenCalledWith(
        'similarity(doctor.fullName, :search)',
        'score',
      );
      expect(mockQueryBuilder.addOrderBy).toHaveBeenCalledWith('score', 'DESC');
    });

    it('should handle pagination edge cases (negative values)', async () => {
      const result = await service.findAllDoctors({ page: -1, limit: -5 });
      expect(result.meta.page).toBe(1);
      expect(result.meta.limit).toBe(1); // Min limit 1
      expect(mockQueryBuilder.skip).toHaveBeenCalledWith(0);
    });
  });

  describe('findDoctorById', () => {
    it('should return doctor details if found', async () => {
      mockRepository.findOne.mockResolvedValue(mockDoctorProfile);
      const result = await service.findDoctorById(1);
      expect(result).toEqual(mockDoctorProfile);
    });

    it('should throw NotFoundException if doctor does not exist', async () => {
      mockRepository.findOne.mockResolvedValue(null);
      await expect(service.findDoctorById(999)).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('Profile Management', () => {
    it('should create a new profile', async () => {
      mockRepository.findOne.mockResolvedValue(null);
      mockRepository.create.mockReturnValue(mockDoctorProfile);
      mockRepository.save.mockResolvedValue(mockDoctorProfile);

      const result = await service.createProfile(1, {} as any);
      expect(result).toEqual(mockDoctorProfile);
    });

    it('should throw ConflictException if profile already exists', async () => {
      mockRepository.findOne.mockResolvedValue(mockDoctorProfile);
      await expect(service.createProfile(1, {} as any)).rejects.toThrow(
        ConflictException,
      );
    });
  });
});
