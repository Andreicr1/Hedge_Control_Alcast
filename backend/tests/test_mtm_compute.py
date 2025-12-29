from datetime import datetime

from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from app.database import Base
from app import models
from app.services.mtm_service import compute_mtm_for_hedge


def setup_inmemory_session():
    engine = create_engine("sqlite:///:memory:")
    Base.metadata.create_all(bind=engine)
    TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
    return TestingSessionLocal()


def test_compute_mtm_for_hedge_with_market_price():
    db = setup_inmemory_session()
    # seed hedge
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

    # seed market price
    mp = models.MarketPrice(
        source="LME",
        symbol="LME-ALU",
        price=2300.0,
        currency="USD",
        as_of=datetime.utcnow(),
    )
    db.add(mp)
    db.commit()

    res = compute_mtm_for_hedge(db, hedge.id)
    assert res is not None
    # For a BUY hedge: (2300-2200) * 25 * 2 = 5000
    assert res.mtm_value == 5000.0
    assert res.fx_rate is None
    assert res.scenario_mtm_value is None
