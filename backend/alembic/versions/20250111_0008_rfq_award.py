"""Add RFQ decision fields and invitation table"""

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = "20250111_0008_rfq_award"
down_revision = "20250111_0007_whatsapp_ingest"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column("rfqs", sa.Column("winner_quote_id", sa.Integer(), sa.ForeignKey("rfq_quotes.id"), nullable=True))
    op.add_column("rfqs", sa.Column("decision_reason", sa.Text(), nullable=True))
    op.add_column("rfqs", sa.Column("decided_by", sa.Integer(), sa.ForeignKey("users.id"), nullable=True))
    op.add_column("rfqs", sa.Column("decided_at", sa.DateTime(timezone=True), nullable=True))
    op.add_column("rfqs", sa.Column("winner_rank", sa.Integer(), nullable=True))
    op.add_column("rfqs", sa.Column("hedge_id", sa.Integer(), sa.ForeignKey("hedges.id"), nullable=True))
    op.add_column("rfqs", sa.Column("hedge_reference", sa.String(length=128), nullable=True))


def downgrade() -> None:
    op.drop_column("rfqs", "hedge_reference")
    op.drop_column("rfqs", "hedge_id")
    op.drop_column("rfqs", "winner_rank")
    op.drop_column("rfqs", "decided_at")
    op.drop_column("rfqs", "decided_by")
    op.drop_column("rfqs", "decision_reason")
    op.drop_column("rfqs", "winner_quote_id")
