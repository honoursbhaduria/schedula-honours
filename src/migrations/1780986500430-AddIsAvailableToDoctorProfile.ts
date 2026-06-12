import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddIsAvailableToDoctorProfile1780986500430 implements MigrationInterface {
  name = 'AddIsAvailableToDoctorProfile1780986500430';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "doctor_profiles" DROP CONSTRAINT "FK_97960655d40a02b66236b217e18"`,
    );
    await queryRunner.query(
      `ALTER TABLE "patient_profiles" DROP CONSTRAINT "FK_3313936616013a7c64c718b53e4"`,
    );
    await queryRunner.query(
      `ALTER TABLE "doctor_profiles" ADD "isAvailable" boolean NOT NULL DEFAULT true`,
    );
    await queryRunner.query(
      `ALTER TABLE "doctor_profiles" ADD CONSTRAINT "FK_a798afca9436b00dac80f911a83" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "patient_profiles" ADD CONSTRAINT "FK_fc4788002ae2de0a68f6ccf24e5" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "patient_profiles" DROP CONSTRAINT "FK_fc4788002ae2de0a68f6ccf24e5"`,
    );
    await queryRunner.query(
      `ALTER TABLE "doctor_profiles" DROP CONSTRAINT "FK_a798afca9436b00dac80f911a83"`,
    );
    await queryRunner.query(
      `ALTER TABLE "doctor_profiles" DROP COLUMN "isAvailable"`,
    );
    await queryRunner.query(
      `ALTER TABLE "patient_profiles" ADD CONSTRAINT "FK_3313936616013a7c64c718b53e4" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "doctor_profiles" ADD CONSTRAINT "FK_97960655d40a02b66236b217e18" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
  }
}
