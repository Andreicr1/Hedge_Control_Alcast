from datetime import date

from app.services import rfq_engine


def test_forward_fix_payoff_and_ppt():
    cal = rfq_engine.HolidayCalendar()
    trade = rfq_engine.RfqTrade(
        trade_type=rfq_engine.TradeType.FORWARD,
        leg1=rfq_engine.Leg(
            side=rfq_engine.Side.BUY,
            price_type=rfq_engine.PriceType.FIX,
            quantity_mt=10,
            fixing_date=date(2024, 1, 2),  # Tuesday
        ),
    )
    text = rfq_engine.generate_rfq_text(trade=trade, cal=cal, company_header=None, company_label_for_payoff="Alcast")

    assert "How can I Buy 10 mt Al USD ppt 04/01/24?" in text
    assert (
        "Expected Payoff:\nIf the official price of 02/01/24 is higher than the Fixed Price, Alcast receives the difference. "
        "If the official price is lower, Alcast pays the difference."
    ) in text
