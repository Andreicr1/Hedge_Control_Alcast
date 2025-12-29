from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app import models
from app.api.deps import require_roles
from app.database import get_db

router = APIRouter(prefix="/inbox", tags=["inbox"])


@router.get(
    "/counts",
    dependencies=[
        Depends(
            require_roles(
                models.RoleName.admin,
                models.RoleName.compras,
                models.RoleName.vendas,
                models.RoleName.financeiro,
            )
        )
    ],
)
def inbox_counts(db: Session = Depends(get_db)):
    return {
        "purchase_orders_pending": db.query(models.PurchaseOrder)
        .filter(models.PurchaseOrder.status == models.OrderStatus.submitted)
        .count(),
        "sales_orders_pending": db.query(models.SalesOrder)
        .filter(models.SalesOrder.status == models.OrderStatus.submitted)
        .count(),
        "rfqs_draft": db.query(models.Rfq).filter(models.Rfq.status == models.RfqStatus.draft).count(),
        "rfqs_sent": db.query(models.Rfq).filter(models.Rfq.status == models.RfqStatus.sent).count(),
    }
