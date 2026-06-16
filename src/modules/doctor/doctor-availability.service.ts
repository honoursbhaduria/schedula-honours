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
    // Use UTC methods because new Date('YYYY-MM-DD') is parsed as UTC
    const dayOfWeek = days[date.getUTCDay()] as DayOfWeek;

    return this.recurringRepo.find({
      where: { doctorId, dayOfWeek },
      order: { startTime: 'ASC' },
    });
  }

  async seedDebugData() {
    try {
      const doctorId = 44;
      const date = '2026-06-20';

      // 0. SELF-HEALING: Update the production DB enum if it's outdated
      // We use a try-catch for the ALTER because Postgres doesn't allow 'IF NOT EXISTS' for ADD VALUE in some versions
      try {
        await this.dataSource.query(
          `ALTER TYPE "appointments_status_enum" ADD VALUE 'BOOKED'`,
        );
        this.logger.log('Successfully added BOOKED to enum in database.');
      } catch (e) {
        // Ignore error if it already exists
      }

      // 1. Seed Availability for Doctor 44
      await this.customRepo.delete({ doctorId, date });
      await this.customRepo.save({
        doctorId,
        date,
        startTime: '09:00',
        endTime: '17:00',
      });

      // 2. Get a patient
      const patient = (await this.dataSource.query(
        `SELECT id FROM patient_profiles LIMIT 1`,
      )) as { id: number }[];

      if (patient && patient.length > 0) {
        const patientId = patient[0].id;

        // 3. Create diverse appointments for testing
        await this.appointmentRepo.delete({ doctorId, date });

        const testAppointments = [
          {
            doctorId,
            patientId,
            date,
            startTime: '10:00',
            endTime: '10:30',
            status: AppointmentStatus.BOOKED,
          },
          {
            doctorId,
            patientId,
            date,
            startTime: '11:00',
            endTime: '11:30',
            status: AppointmentStatus.COMPLETED,
          },
          {
            doctorId,
            patientId,
            date,
            startTime: '12:00',
            endTime: '12:30',
            status: AppointmentStatus.CANCELLED,
          },
        ];

        await this.appointmentRepo.save(testAppointments as any);

        return {
          message: `Seeded availability and 3 test appointments (BOOKED, COMPLETED, CANCELLED) for Doctor 44 on ${date}`,
          doctorId,
          patientId,
          appointments: testAppointments.map((a) => ({
            time: a.startTime,
            status: a.status,
          })),
        };
      }

      return {
        message: `Seeded availability for Doctor 44 on ${date}, but no patient found.`,
      };
    } catch (err: unknown) {
      const error = err as {
        message?: string;
        stack?: string;
        detail?: string;
      };
      return {
        error: true,
        message: error.message || 'Unknown error',
      };
    }
  }

  async getAvailableSlots(
    doctorId: number,
    dateString: string,
    requestedDuration?: number,
  ) {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) {
      throw new BadRequestException(
        'Invalid date format. Expected YYYY-MM-DD.',
      );
    }

    const now = new Date();
    const todayStr = now.toLocaleDateString('en-CA');

    if (dateString < todayStr) {
      throw new BadRequestException('Cannot fetch slots for past dates');
    }

    const doctor = await this.doctorRepo.findOne({ where: { id: doctorId } });
    if (!doctor) throw new NotFoundException('Doctor not found');

    const availability = await this.getAvailabilityForDoctorDate(
      doctorId,
      dateString,
    );
    if (availability.length === 0) return [];

    // Filter booked appointments
    const bookedAppointments = await this.appointmentRepo.find({
      where: {
        doctorId,
        date: dateString,
        status: AppointmentStatus.BOOKED,
      },
    });

    if (doctor.schedulingType === 'WAVE') {
      return this.generateWaveSlots(
        doctor,
        availability,
        bookedAppointments,
        dateString,
        todayStr,
        now,
      );
    } else {
      // STREAM
      const duration = requestedDuration || doctor.slotDuration;
      return this.generateStreamSlots(
        doctor,
        availability,
        bookedAppointments,
        duration,
        dateString,
        todayStr,
        now,
      );
    }
  }

  private generateWaveSlots(
    doctor: DoctorProfile,
    ranges: { startTime: string | null; endTime: string | null }[],
    booked: Appointment[],
    dateString: string,
    todayStr: string,
    now: Date,
  ) {
    const currentMinutes = now.getHours() * 60 + now.getMinutes();

    return ranges
      .filter((r) => r.startTime && r.endTime)
      .map((range) => {
        const start = this.timeToMinutes(range.startTime!);
        const end = this.timeToMinutes(range.endTime!);

        const bookingsInWindow = booked.filter((b) => {
          const bStart = this.timeToMinutes(b.startTime);
          return bStart >= start && bStart < end;
        });

        const isPast =
          dateString === todayStr &&
          this.timeToMinutes(range.endTime!) <= currentMinutes;

        return {
          type: 'WAVE',
          startTime: range.startTime!.substring(0, 5),
          endTime: range.endTime!.substring(0, 5),
          maxCapacity: doctor.maxCapacity,
          bookedCount: bookingsInWindow.length,
          availableCount: Math.max(
            0,
            doctor.maxCapacity - bookingsInWindow.length,
          ),
          isFull: bookingsInWindow.length >= doctor.maxCapacity,
          isPast,
        };
      })
      .filter((w) => !w.isPast);
  }

  private generateStreamSlots(
    doctor: DoctorProfile,
    ranges: { startTime: string | null; endTime: string | null }[],
    booked: Appointment[],
    duration: number,
    dateString: string,
    todayStr: string,
    now: Date,
  ) {
    const slots: any[] = [];
    const currentMinutes = now.getHours() * 60 + now.getMinutes();
    const buffer = doctor.bufferTime || 0;

    for (const range of ranges) {
      if (!range.startTime || !range.endTime) continue;

      let current = this.timeToMinutes(range.startTime);
      const end = this.timeToMinutes(range.endTime);

      while (current + duration <= end) {
        const slotStart = current;
        const slotEnd = current + duration;

        const isBooked = booked.some((b) => {
          const bStart = this.timeToMinutes(b.startTime);
          const bEnd = this.timeToMinutes(b.endTime);
          return slotStart < bEnd && slotEnd > bStart;
        });

        const isPast = dateString === todayStr && slotStart <= currentMinutes;

        if (!isBooked && !isPast) {
          slots.push({
            type: 'STREAM',
            startTime: this.minutesToTime(slotStart),
            endTime: this.minutesToTime(slotEnd),
          });
        }

        current += duration + buffer;
      }
    }

    return slots;
  }
}
