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
    private readonly dataSource: DataSource,
  ) {}

  private timeToMinutes(time: string): number {
    const [hours, minutes] = time.split(':').map(Number);
    return hours * 60 + minutes;
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
    const date = new Date(dateString);
    if (isNaN(date.getTime())) {
      throw new BadRequestException(
        'Invalid date format. Expected YYYY-MM-DD.',
      );
    }

    const overrides = await this.customRepo.find({
      where: { doctorId: doctor.id, date: dateString },
      order: { startTime: 'ASC' },
    });

    if (overrides.length > 0) {
      // If there's a null slot, it means fully unavailable
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
      where: { doctorId: doctor.id, dayOfWeek },
      order: { startTime: 'ASC' },
    });
  }
}
