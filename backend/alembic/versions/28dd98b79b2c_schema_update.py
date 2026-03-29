"""schema update

Revision ID: 28dd98b79b2c
Revises: a32fd9897fc9
"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
import geoalchemy2

# revision identifiers
revision: str = '28dd98b79b2c'
down_revision: Union[str, None] = 'a32fd9897fc9'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


# -----------------------------
# ENUM DEFINITIONS
# -----------------------------
alerttype = sa.Enum(
    "POTHOLES_DETECTED", "ROAD_DAMAGE", "REPAIR_COMPLETED", "EMERGENCY",
    name="alerttype"
)

alertpriority = sa.Enum(
    "LOW", "MEDIUM", "HIGH", "CRITICAL",
    name="alertpriority"
)

severity = sa.Enum("S1", "S2", "S3", name="severity")

potholestatus = sa.Enum(
    "CANDIDATE", "CONFIRMED", "REPAIR_CLAIMED", "REPAIRED", "FRAUD",
    name="potholestatus"
)

claimstatus = sa.Enum(
    "PENDING", "UNDER_REVIEW", "VERIFIED", "FRAUD_DETECTED", "REJECTED",
    name="claimstatus"
)


# -----------------------------
# UPGRADE
# -----------------------------
def upgrade() -> None:
    bind = op.get_bind()

    # Create ENUM types
    alerttype.create(bind, checkfirst=True)
    alertpriority.create(bind, checkfirst=True)
    severity.create(bind, checkfirst=True)
    potholestatus.create(bind, checkfirst=True)
    claimstatus.create(bind, checkfirst=True)

    # Alerts
    op.alter_column(
        'alerts',
        'alert_type',
        existing_type=sa.VARCHAR(),
        type_=alerttype,
        postgresql_using='alert_type::text::alerttype',
        existing_nullable=False
    )

    op.alter_column(
        'alerts',
        'priority',
        existing_type=sa.VARCHAR(),
        type_=alertpriority,
        postgresql_using='priority::text::alertpriority',
        existing_nullable=True
    )

    # Pothole Reports
    op.add_column('pothole_reports', sa.Column('accel_x', sa.Float(), nullable=True))
    op.add_column('pothole_reports', sa.Column('accel_y', sa.Float(), nullable=True))
    op.add_column('pothole_reports', sa.Column('accel_z', sa.Float(), nullable=True))

    op.alter_column(
        'pothole_reports',
        'severity',
        existing_type=sa.VARCHAR(),
        type_=severity,
        postgresql_using='severity::text::severity',
        existing_nullable=True
    )

    # Potholes
    op.add_column(
        'potholes',
        sa.Column(
            'location',
            geoalchemy2.types.Geometry(
                geometry_type='POINT',
                srid=4326,
                from_text='ST_GeomFromEWKT',
                name='geometry'
            ),
            nullable=False
        )
    )

    op.alter_column(
        'potholes',
        'severity',
        existing_type=sa.VARCHAR(),
        type_=severity,
        postgresql_using='severity::text::severity',
        existing_nullable=True
    )

    op.alter_column(
        'potholes',
        'status',
        existing_type=sa.VARCHAR(),
        type_=potholestatus,
        postgresql_using='status::text::potholestatus',
        existing_nullable=True
    )

    op.execute("""
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_indexes WHERE indexname = 'idx_potholes_location'
    ) THEN
        CREATE INDEX idx_potholes_location
        ON potholes USING gist (location);
    END IF;
END$$;
""")

    # Repair Claims
    op.alter_column(
        'repair_claims',
        'status',
        existing_type=sa.VARCHAR(),
        type_=claimstatus,
        postgresql_using='status::text::claimstatus',
        existing_nullable=True
    )

    # Road Segments
    op.execute("""
ALTER TABLE road_segments
ALTER COLUMN boundary TYPE geometry(Polygon,4326)
USING ST_GeomFromText(boundary, 4326);
""")

    op.execute("""
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_indexes WHERE indexname = 'idx_road_segments_boundary'
    ) THEN
        CREATE INDEX idx_road_segments_boundary
        ON road_segments USING gist (boundary);
    END IF;
END$$;
""")


# -----------------------------
# DOWNGRADE
# -----------------------------
def downgrade() -> None:
    op.drop_index('idx_road_segments_boundary', table_name='road_segments', postgresql_using='gist')

    op.alter_column(
    'road_segments',
    'boundary',
    existing_type=sa.VARCHAR(),
    type_=geoalchemy2.types.Geometry(
        geometry_type='POLYGON',
        srid=4326,
        from_text='ST_GeomFromEWKT',
        name='geometry'
    ),
    postgresql_using="boundary::geometry(Polygon,4326)",
    nullable=False
)

    op.alter_column(
        'repair_claims',
        'status',
        type_=sa.VARCHAR(),
        existing_nullable=True
    )

    op.drop_index('idx_potholes_location', table_name='potholes', postgresql_using='gist')

    op.alter_column(
        'potholes',
        'status',
        type_=sa.VARCHAR(),
        existing_nullable=True
    )

    op.alter_column(
        'potholes',
        'severity',
        type_=sa.VARCHAR(),
        existing_nullable=True
    )

    op.drop_column('potholes', 'location')

    op.alter_column(
        'pothole_reports',
        'severity',
        type_=sa.VARCHAR(),
        existing_nullable=True
    )

    op.drop_column('pothole_reports', 'accel_z')
    op.drop_column('pothole_reports', 'accel_y')
    op.drop_column('pothole_reports', 'accel_x')

    op.alter_column(
        'alerts',
        'priority',
        type_=sa.VARCHAR(),
        existing_nullable=True
    )

    op.alter_column(
        'alerts',
        'alert_type',
        type_=sa.VARCHAR(),
        existing_nullable=False
    )