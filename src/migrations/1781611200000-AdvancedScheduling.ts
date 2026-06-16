import { MigrationInterface, QueryRunner } from 'typeorm';

export class AdvancedScheduling1781611200000 implements MigrationInterface {
  name = 'AdvancedScheduling1781611200000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // 1. Add scheduling fields to doctor_profiles
    await queryRunner.query(
      `CREATE TYPE "doctor_profiles_schedulingtype_enum" AS ENUM('STREAM', 'WAVE')`,
    );
    await queryRunner.query(
      `ALTER TABLE "doctor_profiles" ADD "schedulingType" "doctor_profiles_schedulingtype_enum" NOT NULL DEFAULT 'STREAM'`,
    );
    await queryRunner.query(
      `ALTER TABLE "doctor_profiles" ADD "slotDuration" integer NOT NULL DEFAULT 15`,
    );
    await queryRunner.query(
      `ALTER TABLE "doctor_profiles" ADD "bufferTime" integer NOT NULL DEFAULT 0`,
    );
    await queryRunner.query(
      `ALTER TABLE "doctor_profiles" ADD "maxCapacity" integer NOT NULL DEFAULT 5`,
    );

    // 2. Add tokenNumber to appointments
    await queryRunner.query(
      `ALTER TABLE "appointments" ADD "tokenNumber" integer`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "appointments" DROP COLUMN "tokenNumber"`,
    );
    await queryRunner.query(
      `ALTER TABLE "doctor_profiles" DROP COLUMN "maxCapacity"`,
    );
    await queryRunner.query(
      `ALTER TABLE "doctor_profiles" DROP COLUMN "bufferTime"`,
    );
    await queryRunner.query(
      `ALTER TABLE "doctor_profiles" DROP COLUMN "slotDuration"`,
    );
    await queryRunner.query(
      `ALTER TABLE "doctor_profiles" DROP COLUMN "schedulingType"`,
    );
    await queryRunner.query(`DROP TYPE "doctor_profiles_schedulingtype_enum"`);
  }
}
