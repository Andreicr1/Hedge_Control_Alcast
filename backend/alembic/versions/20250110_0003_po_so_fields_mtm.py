"""add detailed po/so fields and mtm record

Revision ID: 20250110_0003
Revises: 20250110_0002
Create Date: 2025-01-10
"""

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql


revision = "20250110_0003"
down_revision = "20250110_0002"
branch_labels = None
depends_on = None


def upgrade() -> None:
    # enums (reuse existing types if already created in earlier revisions)
    op.execute(
        """
        DO $$
        BEGIN
            IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'marketobjecttype') THEN
                CREATE TYPE marketobjecttype AS ENUM ('hedge', 'po', 'so', 'portfolio');
            END IF;
        END$$;
        """
    )
    market_object_enum = postgresql.ENUM(
        "hedge",
        "po",
        "so",
        "portfolio",
        name="marketobjecttype",
        create_type=False,
    )
    pricing_type_enum = postgresql.ENUM(
        "fixed",
        "tbf",
        "monthly_average",
        "lme_premium",
        name="pricingtype",
        create_type=False,
    )

    # purchase_orders
    op.add_column("purchase_orders", sa.Column("product", sa.String(length=255), nullable=True))
    op.add_column("purchase_orders", sa.Column("unit", sa.String(length=16), nullable=True))
    op.add_column("purchase_orders", sa.Column("unit_price", sa.Float(), nullable=True))
    op.add_column("purchase_orders", sa.Column("pricing_period", sa.String(length=32), nullable=True))
    op.add_column("purchase_orders", sa.Column("premium", sa.Float(), nullable=True))
    op.add_column("purchase_orders", sa.Column("reference_price", sa.String(length=64), nullable=True))
    op.add_column("purchase_orders", sa.Column("fixing_deadline", sa.Date(), nullable=True))
    op.add_column("purchase_orders", sa.Column("expected_delivery_date", sa.Date(), nullable=True))
    op.add_column("purchase_orders", sa.Column("location", sa.String(length=128), nullable=True))
    op.add_column("purchase_orders", sa.Column("avg_cost", sa.Float(), nullable=True))
    # expand pricing_type enum if needed
    with op.batch_alter_table("purchase_orders") as batch_op:
        batch_op.alter_column("pricing_type", existing_type=pricing_type_enum, nullable=False)

    # sales_orders
    op.add_column("sales_orders", sa.Column("product", sa.String(length=255), nullable=True))
    op.add_column("sales_orders", sa.Column("unit", sa.String(length=16), nullable=True))
    op.add_column("sales_orders", sa.Column("unit_price", sa.Float(), nullable=True))
    op.add_column("sales_orders", sa.Column("pricing_period", sa.String(length=32), nullable=True))
    op.add_column("sales_orders", sa.Column("premium", sa.Float(), nullable=True))
    op.add_column("sales_orders", sa.Column("reference_price", sa.String(length=64), nullable=True))
    op.add_column("sales_orders", sa.Column("fixing_deadline", sa.Date(), nullable=True))
    op.add_column("sales_orders", sa.Column("expected_delivery_date", sa.Date(), nullable=True))
    op.add_column("sales_orders", sa.Column("location", sa.String(length=128), nullable=True))
    with op.batch_alter_table("sales_orders") as batch_op:
        batch_op.alter_column("pricing_type", existing_type=pricing_type_enum, nullable=False)

    # mtm_records (create only if missing)
    op.execute(
        """
        DO $$
        BEGIN
            IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'mtm_records') THEN
                CREATE TABLE mtm_records (
                    id SERIAL PRIMARY KEY,
                    as_of_date DATE NOT NULL,
                    object_type marketobjecttype NOT NULL,
                    object_id INTEGER,
                    forward_price FLOAT,
                    fx_rate FLOAT,
                    mtm_value FLOAT NOT NULL,
                    methodology VARCHAR(128),
                    computed_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
                );
            END IF;
        END$$;
        """
    )


def downgrade() -> None:
    op.execute("DROP TABLE IF EXISTS mtm_records CASCADE")

    op.drop_column("sales_orders", "location")
    op.drop_column("sales_orders", "expected_delivery_date")
    op.drop_column("sales_orders", "fixing_deadline")
    op.drop_column("sales_orders", "reference_price")
    op.drop_column("sales_orders", "premium")
    op.drop_column("sales_orders", "pricing_period")
    op.drop_column("sales_orders", "unit_price")
    op.drop_column("sales_orders", "unit")
    op.drop_column("sales_orders", "product")

    op.drop_column("purchase_orders", "avg_cost")
    op.drop_column("purchase_orders", "location")
    op.drop_column("purchase_orders", "expected_delivery_date")
    op.drop_column("purchase_orders", "fixing_deadline")
    op.drop_column("purchase_orders", "reference_price")
    op.drop_column("purchase_orders", "premium")
    op.drop_column("purchase_orders", "pricing_period")
    op.drop_column("purchase_orders", "unit_price")
    op.drop_column("purchase_orders", "unit")
    op.drop_column("purchase_orders", "product")

    market_object_enum = sa.Enum("hedge", "po", "so", "portfolio", name="marketobjecttype")
    pricing_type_enum = sa.Enum("fixed", "tbf", "monthly_average", "lme_premium", name="pricingtype")

    market_object_enum.drop(op.get_bind(), checkfirst=True)
    pricing_type_enum.drop(op.get_bind(), checkfirst=True)
