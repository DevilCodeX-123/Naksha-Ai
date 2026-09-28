-- ============================================================
-- NAKSHA Jaipur — Schema update 02
-- Building change tracking (new / demolished / modified structures
-- between two survey periods, e.g. this year's drone pass vs last
-- year's). Run any time after schema.sql.
--
-- Note: nothing ingests into this table automatically yet -- it's
-- populated by a future change-detection comparison step (comparing
-- two building snapshots), not by raw file ingestion like the other
-- tables. The table is created now so it's ready when that logic
-- is built.
-- ============================================================

CREATE TABLE IF NOT EXISTS building_changes (
    id                SERIAL PRIMARY KEY,
    building_id       TEXT,                        -- NULL if newly detected, no prior ID yet
    change_type       TEXT NOT NULL,                -- new / demolished / modified / unchanged
    detected_from      TEXT,                        -- dataset_id of the earlier snapshot
    detected_to        TEXT,                        -- dataset_id of the later snapshot
    area_change_sqm    DOUBLE PRECISION,
    height_change_m    DOUBLE PRECISION,
    confidence_score   NUMERIC(5,2),
    status             TEXT DEFAULT 'unreviewed',   -- unreviewed / confirmed / false_positive
    detected_at        TIMESTAMPTZ DEFAULT now(),
    geom               geometry(MultiPolygon, 32643)
);
CREATE INDEX IF NOT EXISTS idx_building_changes_geom ON building_changes USING GIST (geom);
