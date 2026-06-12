import { MigrationInterface, QueryRunner } from 'typeorm';

export class InitialSchema1717843200000 implements MigrationInterface {
  name = 'InitialSchema1717843200000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "users" ("id" SERIAL NOT NULL, "email" character varying NOT NULL, "name" character varying NOT NULL, "passwordHash" character varying NOT NULL, "role" character varying NOT NULL, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "UQ_97672db888d5592a9622971a1f1" UNIQUE ("email"), CONSTRAINT "PK_a3ffb1cbb1d14033e2750a88e73" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "doctor_profiles" ("id" SERIAL NOT NULL, "fullName" character varying NOT NULL, "specialization" character varying NOT NULL, "experience" integer NOT NULL, "qualification" character varying NOT NULL, "consultationFee" integer NOT NULL, "availability" text NOT NULL, "profileDetails" text, "userId" integer NOT NULL, CONSTRAINT "REL_97960655d40a02b66236b217e1" UNIQUE ("userId"), CONSTRAINT "PK_8e3c834a0256247c1798361099e" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "patient_profiles" ("id" SERIAL NOT NULL, "fullName" character varying NOT NULL, "age" integer NOT NULL, "gender" character varying NOT NULL, "contactDetails" character varying NOT NULL, "basicHealthInfo" text, "userId" integer NOT NULL, CONSTRAINT "REL_3313936616013a7c64c718b53e" UNIQUE ("userId"), CONSTRAINT "PK_4376326e3820245a4437207436b" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `ALTER TABLE "doctor_profiles" ADD CONSTRAINT "FK_97960655d40a02b66236b217e18" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "patient_profiles" ADD CONSTRAINT "FK_3313936616013a7c64c718b53e4" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "patient_profiles" DROP CONSTRAINT "FK_3313936616013a7c64c718b53e4"`,
    );
    await queryRunner.query(
      `ALTER TABLE "doctor_profiles" DROP CONSTRAINT "FK_97960655d40a02b66236b217e18"`,
    );
    await queryRunner.query(`DROP TABLE "patient_profiles"`);
    await queryRunner.query(`DROP TABLE "doctor_profiles"`);
    await queryRunner.query(`DROP TABLE "users"`);
  }
}
