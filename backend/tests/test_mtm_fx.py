from datetime import datetime

from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from app import models
from app.database import Base
from app.services.mtm_service import compute_mtm_for_hedge


# Isolated in-memory DB
engine = create_engine(
    "sqlite://",
    connect_args={"check_same_thread": False},
    poolclass=StaticPool,
)
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base.metadata.create_all(bind=engine)


def setup_function():
    Base.metadata.drop_all(bind=engine)
    Base.metadata.create_all(bind=engine)


def test_mtm_with_fx_conversion():
    db = TestingSessionLocal()

    hedge = models.HedgeTrade(
        hedge_type=models.HedgeType.purchase,
        side=models.HedgeSide.buy,
        lme_contract="LME-ALU",
        contract_month="2025-01",
        lots=2,
        lot_size_tons=25.0,
        price=2200.0,
        notional_tons=50.0,
        status=models.HedgeStatus.planned,
    )
    db.add(hedge)
    db.commit()
    db.refresh(hedge)

    # market price and FX
    db.add(
        models.MarketPrice(
            source="yahoo",
            symbol="LME-ALU",
            price=2300.0,
            currency="USD",
            as_of=datetime.utcnow(),
            fx=False,
        )
    )
    db.add(
        models.MarketPrice(
            source="yahoo",
            symbol="USDBRL=X",
            price=5.0,
            currency="BRL",
            as_of=datetime.utcnow(),
            fx=True,
        )
    )
    db.commit()

    res = compute_mtm_for_hedge(db, hedge.id, fx_symbol="USDBRL=X", pricing_source="yahoo")
    assert res is not None
    # (2300-2200) * 25 * 2 = 5000 USD; FX 5.0 -> 25000 BRL
    assert res.mtm_value == 25000.0
    assert res.fx_rate == 5.0

    db.close()


def test_mtm_with_haircut_scenario():
    db = TestingSessionLocal()

    hedge = models.HedgeTrade(
        hedge_type=models.HedgeType.purchase,
        side=models.HedgeSide.buy,
        lme_contract="LME-ALU",
        contract_month="2025-01",
        lots=2,
        lot_size_tons=25.0,
        price=2200.0,
        notional_tons=50.0,
        status=models.HedgeStatus.planned,
    )
    db.add(hedge)
    db.commit()
    db.refresh(hedge)

    db.add(
        models.MarketPrice(
            source="yahoo",
            symbol="LME-ALU",
            price=2300.0,
            currency="USD",
            as_of=datetime.utcnow(),
            fx=False,
        )
    )
    db.commit()

    res = compute_mtm_for_hedge(db, hedge.id, pricing_source="yahoo", haircut_pct=10.0)
    assert res is not None
    # Base MTM still 5000; haircut lowers price to 2070 -> scenario becomes negative
    assert res.mtm_value == 5000.0
    assert res.scenario_mtm_value == -6500.0
    db.close()
