import { MigrationInterface, QueryRunner } from "typeorm";

export class EnableFuzzySearchAndIndices1800000000000 implements MigrationInterface {
    public async up(queryRunner: QueryRunner): Promise<void> {
        // Enable pg_trgm extension for fuzzy search
        await queryRunner.query(`CREATE EXTENSION IF NOT EXISTS pg_trgm`);
        
        // Add GIST indices for efficient trigram-based search on name and specialization
        await queryRunner.query(`CREATE INDEX IF NOT EXISTS "idx_doctor_profiles_fullname_trgm" ON "doctor_profiles" USING gist ("fullName" gist_trgm_ops)`);
        await queryRunner.query(`CREATE INDEX IF NOT EXISTS "idx_doctor_profiles_specialization_trgm" ON "doctor_profiles" USING gist ("specialization" gist_trgm_ops)`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP INDEX IF EXISTS "idx_doctor_profiles_specialization_trgm"`);
        await queryRunner.query(`DROP INDEX IF EXISTS "idx_doctor_profiles_fullname_trgm"`);
    }
}
