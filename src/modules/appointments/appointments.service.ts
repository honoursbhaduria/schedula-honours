import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Appointment } from './entities/appointment.entity';
import { CreateAppointmentDto } from './dto/create-appointment.dto';
import { AppointmentStatus } from './enums/appointment-status.enum';
import { DoctorProfile } from '../users/entities/doctor-profile.entity';
import { PatientProfile } from '../users/entities/patient-profile.entity';
import { DoctorAvailabilityService } from '../doctor/doctor-availability.service';

@Injectable()
export class AppointmentsService {
  constructor(
    @InjectRepository(Appointment)
    private readonly appointmentRepo: Repository<Appointment>,
    @InjectRepository(DoctorProfile)
    private readonly doctorRepo: Repository<DoctorProfile>,
    @InjectRepository(PatientProfile)
    private readonly patientRepo: Repository<PatientProfile>,
    private readonly availabilityService: DoctorAvailabilityService,
  ) {}

  async bookAppointment(
    userId: number,
    dto: CreateAppointmentDto,
  ): Promise<Appointment> {
    const patient = await this.patientRepo.findOne({ where: { userId } });
    if (!patient) {
      throw new NotFoundException('Patient profile not found');
    }

    const doctor = await this.doctorRepo.findOne({
      where: { id: dto.doctorId },
    });
    if (!doctor) {
      throw new NotFoundException('Doctor not found');
    }

    // 1. Future Date/Time Check
    const appointmentDateTime = new Date(`${dto.date}T${dto.startTime}`);
    if (appointmentDateTime <= new Date()) {
      throw new BadRequestException(
        'Appointment must be for a future date and time',
      );
    }

    // 2. Validate Slot Availability (Duration logic)
    const startMins = this.timeToMinutes(dto.startTime);
    const endMins = this.timeToMinutes(dto.endTime);
    const duration = endMins - startMins;

    if (duration <= 0) {
      throw new BadRequestException('Start time must be before end time');
    }

    const availableSlots = await this.availabilityService.getAvailableSlots(
      dto.doctorId,
      dto.date,
      duration,
    );

    const isSlotAvailable = availableSlots.some(
      (slot) =>
        slot.startTime === dto.startTime && slot.endTime === dto.endTime,
    );

    if (!isSlotAvailable) {
      throw new BadRequestException('The selected slot is not available');
    }

    // 3. Double Booking Check (Extra safety)
    const existing = await this.appointmentRepo.findOne({
      where: {
        doctorId: dto.doctorId,
        date: dto.date,
        startTime: dto.startTime,
        status: AppointmentStatus.BOOKED,
      },
    });

    if (existing) {
      throw new ConflictException('This slot has already been booked');
    }

    const appointment = this.appointmentRepo.create({
      ...dto,
      patientId: patient.id,
      status: AppointmentStatus.BOOKED,
    });

    return this.appointmentRepo.save(appointment);
  }

  async getPatientAppointments(userId: number): Promise<Appointment[]> {
    const patient = await this.patientRepo.findOne({ where: { userId } });
    if (!patient) throw new NotFoundException('Patient profile not found');

    return this.appointmentRepo.find({
      where: { patientId: patient.id },
      relations: { doctor: true },
      order: { date: 'DESC', startTime: 'DESC' },
    });
  }

  async getDoctorAppointments(userId: number): Promise<Appointment[]> {
    const doctor = await this.doctorRepo.findOne({ where: { userId } });
    if (!doctor) throw new NotFoundException('Doctor profile not found');

    return this.appointmentRepo.find({
      where: { doctorId: doctor.id },
      relations: { patient: true },
      order: { date: 'DESC', startTime: 'DESC' },
    });
  }

  async cancelAppointment(
    userId: number,
    appointmentId: number,
  ): Promise<Appointment> {
    const patient = await this.patientRepo.findOne({ where: { userId } });
    if (!patient) throw new NotFoundException('Patient profile not found');

    const appointment = await this.appointmentRepo.findOne({
      where: { id: appointmentId },
    });

    if (!appointment) {
      throw new NotFoundException('Appointment not found');
    }

    if (appointment.patientId !== patient.id) {
      throw new ForbiddenException('You can only cancel your own appointments');
    }

    if (appointment.status === AppointmentStatus.CANCELLED) {
      throw new BadRequestException('Appointment is already cancelled');
    }

    const appointmentDateTime = new Date(
      `${appointment.date}T${appointment.startTime}`,
    );
    if (appointmentDateTime <= new Date()) {
      throw new BadRequestException('Past appointments cannot be cancelled');
    }

    appointment.status = AppointmentStatus.CANCELLED;
    return this.appointmentRepo.save(appointment);
  }

  private timeToMinutes(time: string): number {
    const [hours, minutes] = time.split(':').map(Number);
    return hours * 60 + (minutes || 0);
  }
}
