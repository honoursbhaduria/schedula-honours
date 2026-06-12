import {
  Injectable,
  BadRequestException,
  NotFoundException,
  ConflictException,
  Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { RecurringAvailability } from './entities/recurring-availability.entity';
import { CustomAvailability } from './entities/custom-availability.entity';
import { DoctorProfile } from '../users/entities/doctor-profile.entity';
import { Appointment } from '../appointments/entities/appointment.entity';
import { AppointmentStatus } from '../appointments/enums/appointment-status.enum';
import {
  CreateRecurringAvailabilityDto,
  UpdateRecurringAvailabilityDto,
  CreateCustomAvailabilityOverrideDto,
} from './dto/availability.dto';
import { DayOfWeek } from './enums/day-of-week.enum';

@Injectable()
export class DoctorAvailabilityService {
  private readonly logger = new Logger(DoctorAvailabilityService.name);

  constructor(
    @InjectRepository(RecurringAvailability)
    private readonly recurringRepo: Repository<RecurringAvailability>,
    @InjectRepository(CustomAvailability)
    private readonly customRepo: Repository<CustomAvailability>,
    @InjectRepository(DoctorProfile)
    private readonly doctorRepo: Repository<DoctorProfile>,
    @InjectRepository(Appointment)
    private readonly appointmentRepo: Repository<Appointment>,
    private readonly dataSource: DataSource,
  ) {}

  private timeToMinutes(time: string): number {
    const [hours, minutes] = time.split(':').map(Number);
    return hours * 60 + (minutes || 0);
  }

  private minutesToTime(minutes: number): string {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`;
  }

  private validateTimeRange(startTime: string, endTime: string) {
    if (this.timeToMinutes(startTime) >= this.timeToMinutes(endTime)) {
      throw new BadRequestException(
        `Invalid time range: ${startTime} - ${endTime}. Start time must be before end time.`,
      );
    }
  }

  private checkOverlap(
    newStart: string,
    newEnd: string,
    existingSlots: { startTime: string | null; endTime: string | null }[],
  ) {
    const start = this.timeToMinutes(newStart);
    const end = this.timeToMinutes(newEnd);

    for (const slot of existingSlots) {
      if (!slot.startTime || !slot.endTime) continue;
      const s = this.timeToMinutes(slot.startTime);
      const e = this.timeToMinutes(slot.endTime);

      if (start < e && end > s) {
        return true;
      }
    }
    return false;
  }

  async findDoctorProfile(userId: number): Promise<DoctorProfile> {
    const doctor = await this.doctorRepo.findOne({ where: { userId } });
    if (!doctor) {
      this.logger.warn(`Doctor profile not found for userId: ${userId}`);
      throw new NotFoundException('Doctor profile not found');
    }
    return doctor;
  }

  async createRecurring(userId: number, dto: CreateRecurringAvailabilityDto) {
    const doctor = await this.findDoctorProfile(userId);
    this.validateTimeRange(dto.startTime, dto.endTime);

    const existing = await this.recurringRepo.find({
      where: { doctorId: doctor.id, dayOfWeek: dto.dayOfWeek },
    });

    if (this.checkOverlap(dto.startTime, dto.endTime, existing)) {
      throw new ConflictException(
        `Time slot ${dto.startTime}-${dto.endTime} overlaps with existing recurring availability for ${dto.dayOfWeek}`,
      );
    }

    const availability = this.recurringRepo.create({
      ...dto,
      doctorId: doctor.id,
    });

    this.logger.log(
      `Created recurring availability for doctor ${doctor.id} on ${dto.dayOfWeek}`,
    );
    return this.recurringRepo.save(availability);
  }

  async findAllRecurring(userId: number) {
    const doctor = await this.findDoctorProfile(userId);
    return this.recurringRepo.find({
      where: { doctorId: doctor.id },
      order: { dayOfWeek: 'ASC', startTime: 'ASC' },
    });
  }

  async updateRecurring(
    userId: number,
    id: number,
    dto: UpdateRecurringAvailabilityDto,
  ) {
    const doctor = await this.findDoctorProfile(userId);
    const availability = await this.recurringRepo.findOne({
      where: { id, doctorId: doctor.id },
    });
    if (!availability) {
      throw new NotFoundException(
        `Recurring availability with ID ${id} not found`,
      );
    }

    const startTime = dto.startTime ?? availability.startTime;
    const endTime = dto.endTime ?? availability.endTime;
    const dayOfWeek = dto.dayOfWeek ?? availability.dayOfWeek;

    this.validateTimeRange(startTime, endTime);

    const existing = await this.recurringRepo.find({
      where: { doctorId: doctor.id, dayOfWeek },
    });
    const otherSlots = existing.filter((s) => s.id !== id);

    if (this.checkOverlap(startTime, endTime, otherSlots)) {
      throw new ConflictException(
        'Time slot overlaps with existing recurring availability',
      );
    }

    Object.assign(availability, { ...dto, startTime, endTime, dayOfWeek });
    return this.recurringRepo.save(availability);
  }

  async deleteRecurring(userId: number, id: number) {
    const doctor = await this.findDoctorProfile(userId);
    const result = await this.recurringRepo.delete({ id, doctorId: doctor.id });
    if (result.affected === 0) {
      throw new NotFoundException(
        `Recurring availability with ID ${id} not found`,
      );
    }
    this.logger.log(
      `Deleted recurring availability ID ${id} for doctor ${doctor.id}`,
    );
    return { message: 'Recurring availability deleted successfully' };
  }

  async createOverride(
    userId: number,
    dto: CreateCustomAvailabilityOverrideDto,
  ) {
    const doctor = await this.findDoctorProfile(userId);

    // Validate internal slots for overlaps within the request
    for (let i = 0; i < dto.slots.length; i++) {
      this.validateTimeRange(dto.slots[i].startTime, dto.slots[i].endTime);
      const otherSlots = dto.slots.filter((_, index) => index !== i);
      if (
        this.checkOverlap(
          dto.slots[i].startTime,
          dto.slots[i].endTime,
          otherSlots,
        )
      ) {
        throw new BadRequestException('Overlapping slots provided in override');
      }
    }

    return this.dataSource.transaction(async (manager) => {
      // Use manager for atomic operations
      await manager.delete(CustomAvailability, {
        doctorId: doctor.id,
        date: dto.date,
      });

      if (dto.slots.length === 0) {
        const override = new CustomAvailability();
        override.date = dto.date;
        override.doctorId = doctor.id;
        override.startTime = null;
        override.endTime = null;
        this.logger.log(
          `Doctor ${doctor.id} marked as fully unavailable for ${dto.date}`,
        );
        return manager.save(override);
      }

      const overrides = dto.slots.map((slot) => {
        const override = new CustomAvailability();
        override.date = dto.date;
        override.doctorId = doctor.id;
        override.startTime = slot.startTime;
        override.endTime = slot.endTime;
        return override;
      });
      this.logger.log(
        `Created ${dto.slots.length} override slots for doctor ${doctor.id} on ${dto.date}`,
      );
      return manager.save(overrides);
    });
  }

  async getAvailabilityForDate(userId: number, dateString: string) {
    const doctor = await this.findDoctorProfile(userId);
    return this.getAvailabilityForDoctorDate(doctor.id, dateString);
  }

  async getAvailabilityForDoctorDate(doctorId: number, dateString: string) {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) {
      throw new BadRequestException(
        'Invalid date format. Expected YYYY-MM-DD.',
      );
    }

    const overrides = await this.customRepo.find({
      where: { doctorId, date: dateString },
      order: { startTime: 'ASC' },
    });

    if (overrides.length > 0) {
      if (overrides.length === 1 && overrides[0].startTime === null) {
        return [];
      }
      return overrides;
    }

    const days = [
      'SUNDAY',
      'MONDAY',
      'TUESDAY',
      'WEDNESDAY',
      'THURSDAY',
      'FRIDAY',
      'SATURDAY',
    ];
    const dayOfWeek = days[date.getDay()] as DayOfWeek;

    return this.recurringRepo.find({
      where: { doctorId, dayOfWeek },
      order: { startTime: 'ASC' },
    });
  }

  async seedDebugData() {
    const doctorId = 40;
    const date = '2026-06-20';
    await this.customRepo.delete({ doctorId, date });
    await this.customRepo.save({
      doctorId,
      date,
      startTime: '10:00',
      endTime: '13:00'
    });
    return { message: 'Seeded availability for Doctor 40 on 2026-06-20' };
  }

  async getAvailableSlots(
    doctorId: number,
    dateString: string,
    duration: number = 30,
  ) {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) {
      throw new BadRequestException('Invalid date format. Expected YYYY-MM-DD.');
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const queryDate = new Date(dateString);
    queryDate.setHours(0, 0, 0, 0);

    if (queryDate < today) {
      throw new BadRequestException('Cannot fetch slots for past dates');
    }

    const doctor = await this.doctorRepo.findOne({ where: { id: doctorId } });
    if (!doctor) throw new NotFoundException('Doctor not found');

    if (![10, 15, 30, 60].includes(Number(duration))) {
      throw new BadRequestException(
        'Invalid duration. Allowed values: 10, 15, 30, 60 minutes.',
      );
    }

    const availability = await this.getAvailabilityForDoctorDate(
      doctorId,
      dateString,
    );
    if (availability.length === 0) return [];

    let potentialSlots = this.generateSlotsFromRanges(availability, duration);

    // Filter past slots if today
    if (dateString === today.toISOString().split('T')[0]) {
      const now = new Date();
      const currentMinutes = now.getHours() * 60 + now.getMinutes();
      potentialSlots = potentialSlots.filter(
        (slot) => this.timeToMinutes(slot.startTime) > currentMinutes,
      );
    }

    // Filter booked slots
    const bookedAppointments = await this.appointmentRepo.find({
      where: {
        doctorId,
        date: dateString,
        status: AppointmentStatus.SCHEDULED,
      },
    });

    return potentialSlots.filter((slot) => {
      const slotStart = this.timeToMinutes(slot.startTime);
      const slotEnd = this.timeToMinutes(slot.endTime);

      const isBooked = bookedAppointments.some((booked) => {
        const bookedStart = this.timeToMinutes(booked.startTime);
        const bookedEnd = this.timeToMinutes(booked.endTime);
        return slotStart < bookedEnd && slotEnd > bookedStart;
      });

      return !isBooked;
    });
  }

  private generateSlotsFromRanges(
    ranges: { startTime: string | null; endTime: string | null }[],
    duration: number,
  ) {
    const slots: { startTime: string; endTime: string }[] = [];

    for (const range of ranges) {
      if (!range.startTime || !range.endTime) continue;

      let current = this.timeToMinutes(range.startTime);
      const end = this.timeToMinutes(range.endTime);

      while (current + duration <= end) {
        slots.push({
          startTime: this.minutesToTime(current),
          endTime: this.minutesToTime(current + duration),
        });
        current += duration;
      }
    }

    return slots;
  }
}
