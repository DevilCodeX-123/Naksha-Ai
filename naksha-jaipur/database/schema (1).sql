-- ============================================================
-- NAKSHA Jaipur — PostGIS Schema Initialization
-- Run against jaipur_land_db, after CREATE EXTENSION postgis;
-- All geometry is stored in EPSG:32643 (UTM 43N); the API
-- reprojects to EPSG:4326 only when serving GeoJSON to the map.
-- ============================================================

CREATE EXTENSION IF NOT EXISTS postgis;

-- ------------------------------------------------------------
-- OPTIONAL RESET — uncomment if you already ran the old prototype
-- script and want a clean slate. Safe here since this is dev/
-- synthetic data, not production records.
-- ------------------------------------------------------------
-- DROP TABLE IF EXISTS record_versions, conflicts, layers, imagery_metadata,
--   ai_features, municipal_records, revenue_records, ground_truth, gnss_points,
--   utilities, roads, buildings, parcels, data_sources CASCADE;

-- ------------------------------------------------------------
-- 1. DATA SOURCES — audit trail, mirrors data_catalog.csv
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS data_sources (
    id                 SERIAL PRIMARY KEY,
    dataset_id         TEXT UNIQUE NOT NULL,     -- e.g. DS_04
    dataset_name       TEXT NOT NULL,
    source_type        TEXT,                     -- REAL / SYNTHETIC / DERIVED
    origin             TEXT,                     -- department / agency
    format             TEXT,
    geometry_type      TEXT,
    source_crs         TEXT,
    survey_date        DATE,
    resolution         TEXT,
    coverage           TEXT,
    status             TEXT,
    ingested_at        TIMESTAMPTZ DEFAULT now()
);

-- ------------------------------------------------------------
-- 2. PARCELS (Cadastral)
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS parcels (
    id                 SERIAL PRIMARY KEY,
    parcel_id          TEXT UNIQUE NOT NULL,
    survey_number      TEXT,
    land_use           TEXT,
    owner_name         TEXT,
    area_sqm           DOUBLE PRECISION,
    confidence_score   NUMERIC(5,2),
    source_dataset_id  TEXT REFERENCES data_sources(dataset_id),
    crs_epsg           INTEGER DEFAULT 32643,
    created_at         TIMESTAMPTZ DEFAULT now(),
    updated_at         TIMESTAMPTZ DEFAULT now(),
    geom               geometry(MultiPolygon, 32643) NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_parcels_geom ON parcels USING GIST (geom);

-- ------------------------------------------------------------
-- 3. BUILDINGS
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS buildings (
    id                 SERIAL PRIMARY KEY,
    building_id        TEXT UNIQUE NOT NULL,
    parcel_id          TEXT REFERENCES parcels(parcel_id),
    building_type      TEXT,
    height_m           DOUBLE PRECISION,     -- NULL until derived from DSM/DTM; never a fabricated default
    floors             INTEGER,
    confidence_score   NUMERIC(5,2),
    source_dataset_id  TEXT REFERENCES data_sources(dataset_id),
    created_at         TIMESTAMPTZ DEFAULT now(),
    geom               geometry(MultiPolygon, 32643) NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_buildings_geom ON buildings USING GIST (geom);
CREATE INDEX IF NOT EXISTS idx_buildings_parcel_id ON buildings (parcel_id);

-- ------------------------------------------------------------
-- 4. ROADS
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS roads (
    id                 SERIAL PRIMARY KEY,
    road_id            TEXT UNIQUE,
    road_name          TEXT,
    road_type          TEXT,
    width_m            DOUBLE PRECISION,
    source_dataset_id  TEXT REFERENCES data_sources(dataset_id),
    created_at         TIMESTAMPTZ DEFAULT now(),
    geom               geometry(MultiLineString, 32643) NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_roads_geom ON roads USING GIST (geom);

-- ------------------------------------------------------------
-- 5. UTILITIES (water / sewer / electric networks)
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS utilities (
    id                 SERIAL PRIMARY KEY,
    utility_id         TEXT UNIQUE,
    utility_type       TEXT,      -- water / sewer / electric / gas
    department         TEXT,
    source_dataset_id  TEXT REFERENCES data_sources(dataset_id),
    created_at         TIMESTAMPTZ DEFAULT now(),
    geom               geometry(Geometry, 32643) NOT NULL   -- mixed line/point per catalog
);
CREATE INDEX IF NOT EXISTS idx_utilities_geom ON utilities USING GIST (geom);

-- ------------------------------------------------------------
-- 6. GNSS / CORS CONTROL POINTS
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS gnss_points (
    id                 SERIAL PRIMARY KEY,
    point_id           TEXT UNIQUE,
    point_type         TEXT,      -- CORS / control
    accuracy_m         DOUBLE PRECISION,
    survey_date        DATE,
    source_dataset_id  TEXT REFERENCES data_sources(dataset_id),
    geom               geometry(Point, 32643) NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_gnss_geom ON gnss_points USING GIST (geom);

-- ------------------------------------------------------------
-- 7. GROUND TRUTH (field verification observations)
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS ground_truth (
    id                 SERIAL PRIMARY KEY,
    gt_id              TEXT UNIQUE,
    observation_type   TEXT,
    notes              TEXT,
    verified_by        TEXT,
    survey_date        DATE,
    source_dataset_id  TEXT REFERENCES data_sources(dataset_id),
    geom               geometry(Point, 32643) NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_gt_geom ON ground_truth USING GIST (geom);

-- ------------------------------------------------------------
-- 8. REVENUE RECORDS (tabular, linked to parcels)
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS revenue_records (
    id                 SERIAL PRIMARY KEY,
    revenue_id         TEXT UNIQUE,
    parcel_id          TEXT REFERENCES parcels(parcel_id),
    owner_name         TEXT,
    tax_amount         NUMERIC(12,2),
    tax_status         TEXT,
    record_year        INTEGER,
    source_dataset_id  TEXT REFERENCES data_sources(dataset_id)
);

-- ------------------------------------------------------------
-- 9. MUNICIPAL RECORDS
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS municipal_records (
    id                 SERIAL PRIMARY KEY,
    municipal_id       TEXT UNIQUE,
    record_type        TEXT,
    parcel_id          TEXT REFERENCES parcels(parcel_id),
    department         TEXT,
    status             TEXT,
    source_dataset_id  TEXT REFERENCES data_sources(dataset_id),
    geom               geometry(Geometry, 32643)   -- nullable: some records are non-spatial
);
CREATE INDEX IF NOT EXISTS idx_municipal_geom ON municipal_records USING GIST (geom);

-- ------------------------------------------------------------
-- 10. AI-GENERATED FEATURES
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS ai_features (
    id                 SERIAL PRIMARY KEY,
    feature_id         TEXT UNIQUE,
    feature_type       TEXT,
    confidence_score   NUMERIC(5,2),
    source_model       TEXT,
    extracted_date     DATE,
    source_dataset_id  TEXT REFERENCES data_sources(dataset_id),
    geom               geometry(MultiPolygon, 32643) NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_ai_features_geom ON ai_features USING GIST (geom);

-- ------------------------------------------------------------
-- 11. IMAGERY METADATA (drone / ORI / DSM-DTM raster footprints)
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS imagery_metadata (
    id                 SERIAL PRIMARY KEY,
    image_id           TEXT UNIQUE,
    imagery_type       TEXT,     -- drone / ori / dsm_dtm
    file_path          TEXT,
    resolution_m       DOUBLE PRECISION,
    capture_date       DATE,
    source_dataset_id  TEXT REFERENCES data_sources(dataset_id),
    bounds             geometry(Polygon, 32643)   -- bounding footprint, not the raster itself
);
CREATE INDEX IF NOT EXISTS idx_imagery_bounds ON imagery_metadata USING GIST (bounds);

-- ------------------------------------------------------------
-- 12. LAYERS — drives /layers and /layers/recommended in main.py
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS layers (
    layer_id            SERIAL PRIMARY KEY,
    name                TEXT NOT NULL,
    table_name          TEXT NOT NULL,   -- physical table this layer reads from
    department          TEXT,
    purpose_tags        TEXT[],          -- e.g. {'urban_planning','surveying'}
    default_visibility  BOOLEAN DEFAULT false
);

-- Seed rows so /layers isn't empty on first run — edit freely
INSERT INTO layers (name, table_name, department, purpose_tags, default_visibility) VALUES
  ('Cadastral Parcels',   'parcels',   'Revenue / Land Records',   ARRAY['property_management','urban_planning'], true),
  ('Building Footprints', 'buildings', 'Municipal / Planning',     ARRAY['property_management','urban_planning'], true),
  ('Road Network',        'roads',     'Municipal / Public Works', ARRAY['infrastructure','urban_planning'],      true),
  ('Utility Network',     'utilities', 'Utility Department',       ARRAY['utilities','infrastructure'],           false)
ON CONFLICT DO NOTHING;

-- ------------------------------------------------------------
-- 13. CONFLICTS — Phase 5, confidence/discrepancy tracking
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS conflicts (
    id                 SERIAL PRIMARY KEY,
    record_table       TEXT NOT NULL,
    record_id          TEXT NOT NULL,
    conflict_type      TEXT,
    description        TEXT,
    confidence_score   NUMERIC(5,2),
    status             TEXT DEFAULT 'open',   -- open / resolved
    detected_at        TIMESTAMPTZ DEFAULT now()
);

-- ------------------------------------------------------------
-- 14. RECORD VERSIONS — Phase 5/6, human review + audit trail
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS record_versions (
    id                   SERIAL PRIMARY KEY,
    record_table         TEXT NOT NULL,
    record_id            TEXT NOT NULL,
    version_number       INTEGER NOT NULL,
    changed_by           TEXT,
    change_type          TEXT,     -- create / edit / approve / reject
    previous_attributes  JSONB,
    previous_geom        geometry(Geometry, 32643),
    approval_status      TEXT DEFAULT 'pending',
    changed_at           TIMESTAMPTZ DEFAULT now()
);
