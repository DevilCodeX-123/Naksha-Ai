import json
import os
from pathlib import Path
from typing import Any, Dict, List, Optional

from dotenv import load_dotenv
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field
from sqlalchemy import create_engine, text


# ============================================================
# ENVIRONMENT
# ============================================================

BACKEND_DIR = Path(__file__).resolve().parent
PROJECT_ROOT = BACKEND_DIR.parent

# Your .env is currently at:
# NAKSHA/
#   .env
#
# So we explicitly load that file.
load_dotenv(PROJECT_ROOT / ".env")

DATABASE_URL = os.getenv("DATABASE_URL")

if not DATABASE_URL:
    raise RuntimeError(
        "DATABASE_URL was not found in the project .env file."
    )

engine = create_engine(
    DATABASE_URL,
    pool_pre_ping=True,
)


# ============================================================
# ROUTER
# ============================================================

router = APIRouter(
    prefix="/analytics",
    tags=["Analytics & Reports"],
)


# ============================================================
# ALLOWED LAYERS
#
# IMPORTANT:
# Never let the frontend directly supply arbitrary SQL table
# names. Only these known tables can be queried.
# ============================================================

ALLOWED_LAYERS = {
    "parcels": {
        "table": "parcels",
        "id_column": "parcel_id",
        "kind": "polygon",
    },

    "buildings": {
        "table": "buildings",
        "id_column": "building_id",
        "kind": "polygon",
    },

    "roads": {
        "table": "roads",
        "id_column": "road_id",
        "kind": "line",
    },

    "utilities": {
        "table": "utilities",
        "id_column": "utility_id",
        "kind": "mixed",
    },

    "gnss_points": {
        "table": "gnss_points",
        "id_column": "point_id",
        "kind": "point",
    },

    "ground_truth": {
        "table": "ground_truth",
        "id_column": "gt_id",
        "kind": "point",
    },

    "ai_features": {
        "table": "ai_features",
        "id_column": "feature_id",
        "kind": "polygon",
    },

    "municipal_records": {
        "table": "municipal_records",
        "id_column": "municipal_id",
        "kind": "mixed",
    },

    "imagery_metadata": {
        "table": "imagery_metadata",
        "id_column": "image_id",
        "kind": "polygon",
    },

    # Tabular dataset linked through parcel_id.
    "revenue_records": {
        "table": "revenue_records",
        "id_column": "revenue_id",
        "kind": "tabular",
    },
}


# ============================================================
# REQUEST MODELS
# ============================================================

class AOIRequest(BaseModel):
    geometry: Dict[str, Any]
    layers: List[str] = Field(default_factory=list)


class LayerReportRequest(BaseModel):
    geometry: Dict[str, Any]
    layer: str


class CombinedReportRequest(BaseModel):
    geometry: Dict[str, Any]
    layers: List[str] = Field(default_factory=list)


# ============================================================
# HELPERS
# ============================================================

def validate_layers(layers: List[str]) -> List[str]:
    if not layers:
        raise HTTPException(
            status_code=400,
            detail="At least one analysis layer must be selected.",
        )

    invalid = [
        layer
        for layer in layers
        if layer not in ALLOWED_LAYERS
    ]

    if invalid:
        raise HTTPException(
            status_code=400,
            detail={
                "message": "One or more requested layers are not supported.",
                "invalid_layers": invalid,
                "allowed_layers": list(ALLOWED_LAYERS.keys()),
            },
        )

    # Remove duplicates while preserving order.
    return list(dict.fromkeys(layers))


def validate_geometry(geometry: Dict[str, Any]) -> None:
    if not isinstance(geometry, dict):
        raise HTTPException(
            status_code=400,
            detail="AOI geometry must be a GeoJSON object.",
        )

    geometry_type = geometry.get("type")

    if geometry_type not in {
        "Polygon",
        "MultiPolygon",
    }:
        raise HTTPException(
            status_code=400,
            detail=(
                "AOI must be a GeoJSON Polygon or MultiPolygon."
            ),
        )

    if "coordinates" not in geometry:
        raise HTTPException(
            status_code=400,
            detail="AOI geometry is missing coordinates.",
        )


def geometry_sql_fragment() -> str:
    """
    GeoJSON from frontend is EPSG:4326.
    Database geometry is EPSG:32643.
    """
    return """
        ST_Transform(
            ST_SetSRID(
                ST_GeomFromGeoJSON(
                    :geometry
                ),
                4326
            ),
            32643
        )
    """


def table_exists(table_name: str) -> bool:
    query = text(
        """
        SELECT EXISTS (
            SELECT 1
            FROM information_schema.tables
            WHERE table_schema = 'public'
              AND table_name = :table_name
        )
        """
    )

    with engine.connect() as conn:
        return bool(
            conn.execute(
                query,
                {"table_name": table_name},
            ).scalar()
        )


# ============================================================
# AOI ANALYSIS
# ============================================================

@router.post("/aoi")
def analyze_aoi(request: AOIRequest):
    validate_geometry(request.geometry)

    layers = validate_layers(
        request.layers
    )

    geometry_json = json.dumps(
        request.geometry
    )

    results = {}

    aoi_sql = geometry_sql_fragment()

    # --------------------------------------------------------
    # AOI area
    # --------------------------------------------------------

    with engine.connect() as conn:
        aoi_area = conn.execute(
            text(
                f"""
                SELECT
                    ST_Area(
                        {aoi_sql}
                    )
                """
            ),
            {
                "geometry": geometry_json,
            },
        ).scalar()

    # --------------------------------------------------------
    # Layer-by-layer analysis
    # --------------------------------------------------------

    for layer_name in layers:

        config = ALLOWED_LAYERS[
            layer_name
        ]

        table_name = config["table"]

        if not table_exists(
            table_name
        ):
            results[layer_name] = {
                "status": "table_not_found",
                "feature_count": 0,
            }

            continue

        # ----------------------------------------------------
        # REVENUE
        #
        # No geometry of its own.
        # It is linked through parcel_id.
        # ----------------------------------------------------

        if layer_name == "revenue_records":

            query = text(
                f"""
                SELECT
                    COUNT(*) AS feature_count
                FROM revenue_records rr
                JOIN parcels p
                  ON p.parcel_id = rr.parcel_id
                WHERE ST_Intersects(
                    p.geom,
                    {aoi_sql}
                )
                """
            )

            with engine.connect() as conn:
                count = conn.execute(
                    query,
                    {
                        "geometry": geometry_json,
                    },
                ).scalar() or 0

            results[layer_name] = {
                "status": "success",
                "feature_count": int(count),
                "spatial_relation": (
                    "linked through cadastral parcels"
                ),
            }

            continue

        # ----------------------------------------------------
        # SPATIAL DATASETS
        # ----------------------------------------------------

        if layer_name == "roads":

            query = text(
                f"""
                SELECT
                    COUNT(*) AS feature_count,
                    COALESCE(
                        SUM(
                            ST_Length(
                                ST_Intersection(
                                    r.geom,
                                    {aoi_sql}
                                )
                            )
                        ),
                        0
                    ) AS intersection_length_m
                FROM roads r
                WHERE ST_Intersects(
                    r.geom,
                    {aoi_sql}
                )
                """
            )

            with engine.connect() as conn:
                row = conn.execute(
                    query,
                    {
                        "geometry": geometry_json,
                    },
                ).mappings().first()

            results[layer_name] = {
                "status": "success",
                "feature_count": int(
                    row["feature_count"] or 0
                ),
                "intersection_length_m": float(
                    row["intersection_length_m"] or 0
                ),
            }

            continue

        # ----------------------------------------------------
        # POLYGON / POINT / MIXED DATA
        # ----------------------------------------------------

        query = text(
            f"""
            SELECT
                COUNT(*) AS feature_count
            FROM {table_name} t
            WHERE t.geom IS NOT NULL
              AND ST_Intersects(
                  t.geom,
                  {aoi_sql}
              )
            """
        )

        with engine.connect() as conn:
            count = conn.execute(
                query,
                {
                    "geometry": geometry_json,
                },
            ).scalar() or 0

        results[layer_name] = {
            "status": "success",
            "feature_count": int(count),
        }

    return {
        "status": "success",
        "analysis_crs": "EPSG:32643",
        "aoi": {
            "type": request.geometry.get(
                "type"
            ),
            "area_sqm": float(
                aoi_area or 0
            ),
        },
        "layers_requested": layers,
        "results": results,
    }


# ============================================================
# CONFLICT DETECTION
# ============================================================

@router.post("/conflicts/refresh")
def refresh_conflicts():
    """
    Rebuild the currently implemented deterministic conflicts.

    This does NOT make legal determinations.
    It creates spatial/data-quality candidates for review.
    """

    conflict_types = [
        "invalid_geometry",
        "building_without_parcel",
        "building_road_overlap",
        "parcel_without_revenue",
        "parcel_without_municipal_record",
    ]

    with engine.begin() as conn:

        # Remove only the automatically generated open
        # conflicts owned by this refresh routine.
        conn.execute(
            text(
                """
                DELETE FROM conflicts
                WHERE status = 'open'
                  AND conflict_type = ANY(:types)
                """
            ),
            {
                "types": conflict_types
            },
        )

        # ----------------------------------------------------
        # 1. Invalid parcel geometries
        # ----------------------------------------------------

        if table_exists("parcels"):
            conn.execute(
                text(
                    """
                    INSERT INTO conflicts (
                        record_table,
                        record_id,
                        conflict_type,
                        description,
                        confidence_score,
                        status
                    )
                    SELECT
                        'parcels',
                        p.parcel_id,
                        'invalid_geometry',
                        'Cadastral parcel geometry is invalid.',
                        NULL,
                        'open'
                    FROM parcels p
                    WHERE p.geom IS NOT NULL
                      AND NOT ST_IsValid(p.geom)
                    """
                )
            )

        # ----------------------------------------------------
        # 2. Buildings without a parcel
        # ----------------------------------------------------

        if (
            table_exists("buildings")
            and table_exists("parcels")
        ):
            conn.execute(
                text(
                    """
                    INSERT INTO conflicts (
                        record_table,
                        record_id,
                        conflict_type,
                        description,
                        confidence_score,
                        status
                    )
                    SELECT
                        'buildings',
                        b.building_id,
                        'building_without_parcel',
                        'Building footprint does not intersect a cadastral parcel.',
                        NULL,
                        'open'
                    FROM buildings b
                    WHERE NOT EXISTS (
                        SELECT 1
                        FROM parcels p
                        WHERE b.geom IS NOT NULL
                          AND p.geom IS NOT NULL
                          AND ST_Intersects(
                              b.geom,
                              p.geom
                          )
                    )
                    """
                )
            )

        # ----------------------------------------------------
        # 3. Building / road overlap
        #
        # This is explicitly a spatial conflict candidate,
        # not a legal encroachment decision.
        # ----------------------------------------------------

        if (
            table_exists("buildings")
            and table_exists("roads")
        ):
            conn.execute(
                text(
                    """
                    INSERT INTO conflicts (
                        record_table,
                        record_id,
                        conflict_type,
                        description,
                        confidence_score,
                        status
                    )
                    SELECT DISTINCT
                        'buildings',
                        b.building_id,
                        'building_road_overlap',
                        'Building footprint intersects road geometry; review required.',
                        NULL,
                        'open'
                    FROM buildings b
                    JOIN roads r
                      ON b.geom IS NOT NULL
                     AND r.geom IS NOT NULL
                     AND ST_Intersects(
                         b.geom,
                         r.geom
                     )
                    """
                )
            )

        # ----------------------------------------------------
        # 4. Parcel without revenue record
        # ----------------------------------------------------

        if (
            table_exists("parcels")
            and table_exists("revenue_records")
        ):
            conn.execute(
                text(
                    """
                    INSERT INTO conflicts (
                        record_table,
                        record_id,
                        conflict_type,
                        description,
                        confidence_score,
                        status
                    )
                    SELECT
                        'parcels',
                        p.parcel_id,
                        'parcel_without_revenue',
                        'No linked revenue record was found.',
                        NULL,
                        'open'
                    FROM parcels p
                    WHERE NOT EXISTS (
                        SELECT 1
                        FROM revenue_records rr
                        WHERE rr.parcel_id = p.parcel_id
                    )
                    """
                )
            )

        # ----------------------------------------------------
        # 5. Parcel without municipal record
        # ----------------------------------------------------

        if (
            table_exists("parcels")
            and table_exists("municipal_records")
        ):
            conn.execute(
                text(
                    """
                    INSERT INTO conflicts (
                        record_table,
                        record_id,
                        conflict_type,
                        description,
                        confidence_score,
                        status
                    )
                    SELECT
                        'parcels',
                        p.parcel_id,
                        'parcel_without_municipal_record',
                        'No linked municipal record was found.',
                        NULL,
                        'open'
                    FROM parcels p
                    WHERE NOT EXISTS (
                        SELECT 1
                        FROM municipal_records mr
                        WHERE mr.parcel_id = p.parcel_id
                    )
                    """
                )
            )

        total = conn.execute(
            text(
                """
                SELECT COUNT(*)
                FROM conflicts
                WHERE status = 'open'
                """
            )
        ).scalar() or 0

    return {
        "status": "success",
        "open_conflict_count": int(total),
        "implemented_rules": conflict_types,
    }


# ============================================================
# READ CONFLICTS
# ============================================================

@router.get("/conflicts")
def get_conflicts(
    status: Optional[str] = "open"
):
    query = text(
        """
        SELECT
            id,
            record_table,
            record_id,
            conflict_type,
            description,
            confidence_score,
            status,
            detected_at
        FROM conflicts
        WHERE (:status IS NULL OR status = :status)
        ORDER BY detected_at DESC, id DESC
        """
    )

    with engine.connect() as conn:
        rows = conn.execute(
            query,
            {
                "status": status
            },
        ).mappings().all()

    return {
        "status": "success",
        "count": len(rows),
        "conflicts": [
            dict(row)
            for row in rows
        ],
    }


# ============================================================
# INDIVIDUAL LAYER REPORT
# ============================================================

@router.post("/reports/layer")
def generate_layer_report(
    request: LayerReportRequest
):
    validate_geometry(
        request.geometry
    )

    if (
        request.layer
        not in ALLOWED_LAYERS
    ):
        raise HTTPException(
            status_code=400,
            detail=(
                f"Unsupported layer: "
                f"{request.layer}"
            ),
        )

    result = analyze_aoi(
        AOIRequest(
            geometry=request.geometry,
            layers=[request.layer],
        )
    )

    return {
        "status": "success",
        "report_type": "layer",
        "layer": request.layer,
        "report": result,
    }


# ============================================================
# COMBINED REPORT
# ============================================================

@router.post("/reports/combined")
def generate_combined_report(
    request: CombinedReportRequest
):
    validate_geometry(
        request.geometry
    )

    layers = validate_layers(
        request.layers
    )

    result = analyze_aoi(
        AOIRequest(
            geometry=request.geometry,
            layers=layers,
        )
    )

    # Also include current conflict summary.
    with engine.connect() as conn:
        conflict_count = conn.execute(
            text(
                """
                SELECT COUNT(*)
                FROM conflicts
                WHERE status = 'open'
                """
            )
        ).scalar() or 0

    return {
        "status": "success",
        "report_type": "combined",
        "report": result,
        "quality_summary": {
            "open_conflict_count": int(
                conflict_count
            )
        },
    }