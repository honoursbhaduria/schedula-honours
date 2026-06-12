import { AppDataSource } from './data-source';
import { User } from '../modules/users/entities/user.entity';
import { DoctorProfile } from '../modules/users/entities/doctor-profile.entity';
import { Role } from '../modules/auth/roles.enum';
import * as bcrypt from 'bcrypt';

async function seed() {
  try {
    console.log('Initializing Data Source...');
    await AppDataSource.initialize();
    console.log('Data Source initialized!');

    const userRepository = AppDataSource.getRepository(User);
    const doctorRepository = AppDataSource.getRepository(DoctorProfile);

    const passwordHash = await bcrypt.hash('password123', 10);

    const doctorsData = [
      {
        email: 'sarah.jenkins@example.com',
        name: 'Dr. Sarah Jenkins',
        specialization: 'Endocrinologist',
        experience: 15,
        fee: 120,
        bio: 'Expert in managing uncontrolled Type 2 Diabetes and thyroid disorders.',
        qualification: 'MBBS, MD (Endocrinology)',
        availability: 'Mon-Fri 09:00-17:00'
      },
      {
        email: 'robert.chen@example.com',
        name: 'Dr. Robert Chen',
        specialization: 'Hematologist',
        experience: 10,
        fee: 150,
        bio: 'Specializes in hemoglobin electrophoresis and blood cell disorders.',
        qualification: 'MBBS, MD (Hematology)',
        availability: 'Tue-Sat 10:00-18:00'
      },
      {
        email: 'emily.watson@example.com',
        name: 'Dr. Emily Watson',
        specialization: 'General Physician',
        experience: 20,
        fee: 80,
        bio: 'Comprehensive care for chronic conditions and vitamin deficiencies.',
        qualification: 'MBBS, MD (Internal Medicine)',
        availability: 'Mon-Sat 08:00-14:00'
      },
      {
        email: 'james.miller@example.com',
        name: 'Dr. James Miller',
        specialization: 'Cardiologist',
        experience: 18,
        fee: 200,
        bio: 'Specialist in heart health and lipid management.',
        qualification: 'MBBS, MD, DM (Cardiology)',
        availability: 'Mon-Wed 09:00-17:00'
      },
      {
        email: 'lisa.ray@example.com',
        name: 'Dr. Lisa Ray',
        specialization: 'Dermatologist',
        experience: 8,
        fee: 110,
        bio: 'Treating all skin conditions and allergic reactions.',
        qualification: 'MBBS, MD (Dermatology)',
        availability: 'Mon-Fri 11:00-19:00'
      }
    ];

    for (const data of doctorsData) {
      const existingUser = await userRepository.findOne({ where: { email: data.email } });
      if (existingUser) {
        console.log(`User ${data.email} already exists, skipping...`);
        continue;
      }

      console.log(`Creating user and profile for ${data.name}...`);
      
      // 1. Create User
      const user = userRepository.create({
        email: data.email,
        name: data.name,
        passwordHash,
        role: Role.DOCTOR,
      });
      const savedUser = await userRepository.save(user);

      // 2. Create Doctor Profile
      const profile = doctorRepository.create({
        fullName: data.name,
        specialization: data.specialization,
        experience: data.experience,
        qualification: data.qualification,
        consultationFee: data.fee,
        availability: data.availability,
        profileDetails: data.bio,
        userId: savedUser.id,
        isAvailable: true
      });
      await doctorRepository.save(profile);
      
      console.log(`Successfully seeded ${data.name}`);
    }

    console.log('Seeding completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Error during seeding:', error);
    process.exit(1);
  }
}

seed();
