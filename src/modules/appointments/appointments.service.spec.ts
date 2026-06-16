import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AppointmentsService } from './appointments.service';
import { Appointment } from './entities/appointment.entity';
import { DoctorProfile } from '../users/entities/doctor-profile.entity';
import { PatientProfile } from '../users/entities/patient-profile.entity';
import { DoctorAvailabilityService } from '../doctor/doctor-availability.service';
import { AppointmentStatus } from './enums/appointment-status.enum';
import {
  BadRequestException,
  NotFoundException,
  ConflictException,
  ForbiddenException,
} from '@nestjs/common';

describe('AppointmentsService', () => {
  let service: AppointmentsService;
  let appointmentRepo: jest.Mocked<Repository<Appointment>>;
  let doctorRepo: jest.Mocked<Repository<DoctorProfile>>;
  let patientRepo: jest.Mocked<Repository<PatientProfile>>;
  let availabilityService: jest.Mocked<DoctorAvailabilityService>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AppointmentsService,
        {
          provide: getRepositoryToken(Appointment),
          useValue: {
            find: jest.fn(),
            findOne: jest.fn(),
            create: jest.fn(),
            save: jest.fn(),
          },
        },
        {
          provide: getRepositoryToken(DoctorProfile),
          useValue: {
            findOne: jest.fn(),
          },
        },
        {
          provide: getRepositoryToken(PatientProfile),
          useValue: {
            findOne: jest.fn(),
          },
        },
        {
          provide: DoctorAvailabilityService,
          useValue: {
            getAvailableSlots: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<AppointmentsService>(AppointmentsService);
    appointmentRepo = module.get<jest.Mocked<Repository<Appointment>>>(
      getRepositoryToken(Appointment),
    );
    doctorRepo = module.get<jest.Mocked<Repository<DoctorProfile>>>(
      getRepositoryToken(DoctorProfile),
    );
    patientRepo = module.get<jest.Mocked<Repository<PatientProfile>>>(
      getRepositoryToken(PatientProfile),
    );
    availabilityService = module.get<jest.Mocked<DoctorAvailabilityService>>(
      DoctorAvailabilityService,
    );
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('bookAppointment', () => {
    const dto = {
      doctorId: 1,
      date: '2026-06-20',
      startTime: '10:00',
      endTime: '10:30',
    };

    it('should throw NotFoundException if patient not found', async () => {
      patientRepo.findOne.mockResolvedValue(null);
      await expect(service.bookAppointment(1, dto)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should throw NotFoundException if doctor not found', async () => {
      patientRepo.findOne.mockResolvedValue({ id: 1 } as any);
      doctorRepo.findOne.mockResolvedValue(null);
      await expect(service.bookAppointment(1, dto)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should throw BadRequestException for past date', async () => {
      patientRepo.findOne.mockResolvedValue({ id: 1 } as any);
      doctorRepo.findOne.mockResolvedValue({ id: 1 } as any);
      const pastDto = { ...dto, date: '2020-01-01' };
      await expect(service.bookAppointment(1, pastDto)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should throw BadRequestException if slot is not available', async () => {
      patientRepo.findOne.mockResolvedValue({ id: 1 } as any);
      doctorRepo.findOne.mockResolvedValue({ id: 1, isAvailable: true } as any);
      availabilityService.getAvailableSlots.mockResolvedValue([]);
      await expect(service.bookAppointment(1, dto)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should throw ConflictException if slot already booked', async () => {
      patientRepo.findOne.mockResolvedValue({ id: 1 } as any);
      doctorRepo.findOne.mockResolvedValue({ id: 1, isAvailable: true } as any);
      availabilityService.getAvailableSlots.mockResolvedValue([
        { startTime: '10:00', endTime: '10:30' },
      ]);
      appointmentRepo.findOne.mockResolvedValue({ id: 1 } as any);
      await expect(service.bookAppointment(1, dto)).rejects.toThrow(
        ConflictException,
      );
    });

    it('should book appointment successfully', async () => {
      patientRepo.findOne.mockResolvedValue({ id: 1 } as any);
      doctorRepo.findOne.mockResolvedValue({ id: 1, isAvailable: true } as any);
      availabilityService.getAvailableSlots.mockResolvedValue([
        { startTime: '10:00', endTime: '10:30' },
      ]);
      appointmentRepo.findOne.mockResolvedValue(null);
      appointmentRepo.create.mockReturnValue(dto as any);
      appointmentRepo.save.mockResolvedValue({
        id: 1,
        ...dto,
        status: AppointmentStatus.BOOKED,
      } as any);

      const result = await service.bookAppointment(1, dto);
      expect(result).toBeDefined();
      expect(result.status).toBe(AppointmentStatus.BOOKED);
    });
  });

  describe('cancelAppointment', () => {
    it('should cancel appointment successfully', async () => {
      const appointment = {
        id: 1,
        patientId: 1,
        date: '2026-06-20',
        startTime: '10:00',
        status: AppointmentStatus.BOOKED,
      };
      patientRepo.findOne.mockResolvedValue({ id: 1 } as any);
      appointmentRepo.findOne.mockResolvedValue(appointment as any);
      appointmentRepo.save.mockResolvedValue({
        ...appointment,
        status: AppointmentStatus.CANCELLED,
      } as any);

      const result = await service.cancelAppointment(1, 1);
      expect(result.status).toBe(AppointmentStatus.CANCELLED);
    });

    it('should throw ForbiddenException if not the owner', async () => {
      const appointment = { id: 1, patientId: 2 };
      patientRepo.findOne.mockResolvedValue({ id: 1 } as any);
      appointmentRepo.findOne.mockResolvedValue(appointment as any);
      await expect(service.cancelAppointment(1, 1)).rejects.toThrow(
        ForbiddenException,
      );
    });
  });
});
