import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddDoctorAvailability1781190736539 implements MigrationInterface {
  name = 'AddDoctorAvailability1781190736539';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `DROP INDEX "public"."idx_doctor_profiles_fullname_trgm"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."idx_doctor_profiles_specialization_trgm"`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."recurring_availabilities_dayofweek_enum" AS ENUM('MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY', 'SUNDAY')`,
    );
    await queryRunner.query(
      `CREATE TABLE "recurring_availabilities" ("id" SERIAL NOT NULL, "dayOfWeek" "public"."recurring_availabilities_dayofweek_enum" NOT NULL, "startTime" TIME NOT NULL, "endTime" TIME NOT NULL, "doctorId" integer NOT NULL, CONSTRAINT "PK_f6ee35ff4cdc7d4b1f3cf6eeb1c" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "custom_availabilities" ("id" SERIAL NOT NULL, "date" date NOT NULL, "startTime" TIME, "endTime" TIME, "doctorId" integer NOT NULL, CONSTRAINT "PK_f15acb0917f78a34b135afeec8c" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `ALTER TABLE "recurring_availabilities" ADD CONSTRAINT "FK_83f738fc97c2ad1b48afc93c4ba" FOREIGN KEY ("doctorId") REFERENCES "doctor_profiles"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "custom_availabilities" ADD CONSTRAINT "FK_85d03cc0bee30c4f72f4ac00463" FOREIGN KEY ("doctorId") REFERENCES "doctor_profiles"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "custom_availabilities" DROP CONSTRAINT "FK_85d03cc0bee30c4f72f4ac00463"`,
    );
    await queryRunner.query(
      `ALTER TABLE "recurring_availabilities" DROP CONSTRAINT "FK_83f738fc97c2ad1b48afc93c4ba"`,
    );
    await queryRunner.query(`DROP TABLE "custom_availabilities"`);
    await queryRunner.query(`DROP TABLE "recurring_availabilities"`);
    await queryRunner.query(
      `DROP TYPE "public"."recurring_availabilities_dayofweek_enum"`,
    );
    await queryRunner.query(
      `CREATE INDEX "idx_doctor_profiles_specialization_trgm" ON "doctor_profiles" USING gist ("specialization") `,
    );
    await queryRunner.query(
      `CREATE INDEX "idx_doctor_profiles_fullname_trgm" ON "doctor_profiles" USING gist ("fullName") `,
    );
  }
}
