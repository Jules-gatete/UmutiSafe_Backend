const { sequelize } = require('../config/database');
const { QueryTypes } = require('sequelize');
require('dotenv').config();

const statements = [
  `ALTER TABLE "disposals" ADD COLUMN IF NOT EXISTS "medicine_name" VARCHAR(255);`,
  `ALTER TABLE "disposals" ADD COLUMN IF NOT EXISTS "input_generic_name" VARCHAR(255);`,
  `ALTER TABLE "disposals" ADD COLUMN IF NOT EXISTS "predicted_category_confidence" NUMERIC(5,4);`,
  `ALTER TABLE "disposals" ADD COLUMN IF NOT EXISTS "handling_method" VARCHAR(255);`,
  `ALTER TABLE "disposals" ADD COLUMN IF NOT EXISTS "disposal_remarks" TEXT;`,
  `ALTER TABLE "disposals" ADD COLUMN IF NOT EXISTS "category_code" VARCHAR(255);`,
  `ALTER TABLE "disposals" ADD COLUMN IF NOT EXISTS "category_label" VARCHAR(255);`,
  `ALTER TABLE "disposals" ADD COLUMN IF NOT EXISTS "similar_generic_name" VARCHAR(255);`,
  `ALTER TABLE "disposals" ADD COLUMN IF NOT EXISTS "similarity_distance" NUMERIC(6,4);`,
  `DO $$
   BEGIN
     IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'enum_disposals_prediction_input_type') THEN
       CREATE TYPE enum_disposals_prediction_input_type AS ENUM ('text','image','manual');
     END IF;
   END$$;`,
  `ALTER TABLE "disposals" ADD COLUMN IF NOT EXISTS "prediction_input_type" enum_disposals_prediction_input_type;`,
  `ALTER TABLE "disposals" ADD COLUMN IF NOT EXISTS "prediction_source" VARCHAR(255);`,
  `ALTER TABLE "disposals" ADD COLUMN IF NOT EXISTS "model_version" VARCHAR(255);`,
  `ALTER TABLE "disposals" ADD COLUMN IF NOT EXISTS "analysis" TEXT;`,
  `ALTER TABLE "disposals" ADD COLUMN IF NOT EXISTS "disposal_methods" JSONB;`,
  `ALTER TABLE "disposals" ADD COLUMN IF NOT EXISTS "dosage_forms" JSONB;`,
  `ALTER TABLE "disposals" ADD COLUMN IF NOT EXISTS "manufacturers" JSONB;`,
  `ALTER TABLE "disposals" ADD COLUMN IF NOT EXISTS "messages" JSONB;`,
  `ALTER TABLE "disposals" ADD COLUMN IF NOT EXISTS "errors" JSONB;`,
  `ALTER TABLE "disposals" ADD COLUMN IF NOT EXISTS "prediction_details" JSONB;`,
  `ALTER TABLE "disposals" ADD COLUMN IF NOT EXISTS "metadata" JSONB;`
];

(async () => {
  try {
    console.log('🔧 Patching disposals table...');
    await sequelize.authenticate();
    console.log('✅ Database connection established');

    for (const sql of statements) {
      console.log(`→ ${sql.split('\n')[0]}`);
      await sequelize.query(sql, { type: QueryTypes.RAW });
    }

    console.log('✅ Disposals table patched successfully');
  } catch (err) {
    console.error('❌ Failed to patch disposals table:', err.message);
    console.error(err);
    process.exitCode = 1;
  } finally {
    await sequelize.close().catch(() => {});
  }
})();
