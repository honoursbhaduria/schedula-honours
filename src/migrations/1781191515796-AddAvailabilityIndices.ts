import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddAvailabilityIndices1781191515796 implements MigrationInterface {
  name = 'AddAvailabilityIndices1781191515796';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE INDEX "IDX_cfe6d62447bee92bcd0150bef2" ON "recurring_availabilities"  ("doctorId", "dayOfWeek") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_5a264ed212d56d85b9ead3896b" ON "custom_availabilities"  ("doctorId", "date") `,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `DROP INDEX "public"."IDX_5a264ed212d56d85b9ead3896b"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_cfe6d62447bee92bcd0150bef2"`,
    );
  }
}
