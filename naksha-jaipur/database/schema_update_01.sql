-- ============================================================
-- NAKSHA Jaipur — Schema update 01
-- Run this once, after schema.sql and before the ETL pipeline.
-- Safe: revenue_records, municipal_records, and data_sources have
-- no data loaded into them yet, so nothing is lost.
-- ============================================================

-- data_catalog.csv has a "department" field separate from origin/
-- source_type that the original schema didn't capture.
ALTER TABLE data_sources
    ADD COLUMN IF NOT EXISTS department TEXT;

-- Real Rajasthan Revenue Department fields used by the synthetic
-- (and eventually real) revenue records.
ALTER TABLE revenue_records
    ADD COLUMN IF NOT EXISTS khasra_number TEXT,
    ADD COLUMN IF NOT EXISTS khata_number TEXT,
    ADD COLUMN IF NOT EXISTS khatedar_name TEXT,
    ADD COLUMN IF NOT EXISTS tehsil TEXT,
    ADD COLUMN IF NOT EXISTS patwari_circle TEXT,
    ADD COLUMN IF NOT EXISTS land_classification TEXT,
    ADD COLUMN IF NOT EXISTS area_bigha NUMERIC(10,3),
    ADD COLUMN IF NOT EXISTS jamabandi_year INTEGER;

-- Real Jaipur Municipal Corporation fields (UPIC / ward / UD-Tax
-- property classification) used by the synthetic municipal records.
ALTER TABLE municipal_records
    ADD COLUMN IF NOT EXISTS upic TEXT,
    ADD COLUMN IF NOT EXISTS ward_no INTEGER,
    ADD COLUMN IF NOT EXISTS property_type TEXT;
