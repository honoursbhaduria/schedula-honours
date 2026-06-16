import { AppDataSource } from './data-source';
import { RecurringAvailability } from '../modules/doctor/entities/recurring-availability.entity';
import { CustomAvailability } from '../modules/doctor/entities/custom-availability.entity';
import { DayOfWeek } from '../modules/doctor/enums/day-of-week.enum';

async function seed() {
  try {
    console.log('Initializing Data Source...');
    await AppDataSource.initialize();
    
    const recurringRepo = AppDataSource.getRepository(RecurringAvailability);
    const customRepo = AppDataSource.getRepository(CustomAvailability);

    const doctorId = 40; // The ID you are testing

    console.log(`Seeding availability for Doctor ID: ${doctorId}`);

    // 1. Add Recurring Availability for SATURDAY (June 20, 2026 is a Saturday)
    const recurring = recurringRepo.create({
      doctorId,
      dayOfWeek: DayOfWeek.SATURDAY,
      startTime: '09:00',
      endTime: '12:00'
    });
    await recurringRepo.save(recurring);
    console.log('Added recurring availability: Sat 09:00-12:00');

    // 2. Add Custom Override for the specific date you are testing
    const override = customRepo.create({
      doctorId,
      date: '2026-06-20',
      startTime: '14:00',
      endTime: '17:00'
    });
    await customRepo.save(override);
    console.log('Added custom override for 2026-06-20: 14:00-17:00');

    console.log('Seeding completed! You can now test the API.');
    process.exit(0);
  } catch (error) {
    console.error('Error seeding data:', error);
    process.exit(1);
  }
}

seed();
