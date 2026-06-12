import { MigrationInterface, QueryRunner } from "typeorm";

export class AddAppointments1781243200000 implements MigrationInterface {
    name = 'AddAppointments1781243200000'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TYPE "public"."appointments_status_enum" AS ENUM('SCHEDULED', 'COMPLETED', 'CANCELLED')`);
        await queryRunner.query(`CREATE TABLE "appointments" ("id" SERIAL NOT NULL, "date" date NOT NULL, "startTime" TIME NOT NULL, "endTime" TIME NOT NULL, "status" "public"."appointments_status_enum" NOT NULL DEFAULT 'SCHEDULED', "doctorId" integer NOT NULL, "patientId" integer NOT NULL, CONSTRAINT "PK_4a437cd309d61abc6643036845f" PRIMARY KEY ("id"))`);
        await queryRunner.query(`ALTER TABLE "appointments" ADD CONSTRAINT "FK_664e72323e0f9b6a9e1e1d0f5e1" FOREIGN KEY ("doctorId") REFERENCES "doctor_profiles"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "appointments" ADD CONSTRAINT "FK_664e72323e0f9b6a9e1e1d0f5e2" FOREIGN KEY ("patientId") REFERENCES "patient_profiles"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "appointments" DROP CONSTRAINT "FK_664e72323e0f9b6a9e1e1d0f5e2"`);
        await queryRunner.query(`ALTER TABLE "appointments" DROP CONSTRAINT "FK_664e72323e0f9b6a9e1e1d0f5e1"`);
        await queryRunner.query(`DROP TABLE "appointments"`);
        await queryRunner.query(`DROP TYPE "public"."appointments_status_enum"`);
    }
}
