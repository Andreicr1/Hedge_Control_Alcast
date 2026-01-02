import { Rfq, RfqQuote, RfqSide } from '../types/api';

type TradeScore = {
  groupId: string;
  buyPrice: number;
  sellPrice?: number;
  quotedAt?: number;
};

type RankedEntry = {
  counterparty_id?: number;
  counterparty_name: string;
  score: number;
  display: string;
  trades: TradeScore[];
};

const parseDate = (value?: string) => {
  if (!value) return Number.MAX_SAFE_INTEGER;
  const t = Date.parse(value);
  return Number.isNaN(t) ? Number.MAX_SAFE_INTEGER : t;
};

const groupTrades = (quotes: RfqQuote[]): TradeScore[] => {
  const byGroup: Record<string, RfqQuote[]> = {};
  quotes.forEach((q, idx) => {
    const key = q.quote_group_id || `q-${q.id || idx}`;
    if (!byGroup[key]) byGroup[key] = [];
    byGroup[key].push(q);
  });

  return Object.entries(byGroup).map(([groupId, legs]) => {
    const buy = legs.find((l) => (l.leg_side || '').toLowerCase() === 'buy');
    const sell = legs.find((l) => (l.leg_side || '').toLowerCase() === 'sell' && l !== buy);
    const altSecond = legs.find((l) => l !== buy);
    const buyPrice = buy?.quote_price ?? legs[0]?.quote_price ?? 0;
    const sellPrice = sell?.quote_price ?? altSecond?.quote_price;
    const quotedAt = Math.min(...legs.map((l, idx) => parseDate(l.quoted_at) + idx));
    return { groupId, buyPrice, sellPrice, quotedAt };
  });
};

const formatMoney = (v: number) => `USD ${v.toFixed(2)}`;

export const rankRfq = (rfq: Rfq) => {
  const side: RfqSide = rfq.side || 'buy';
  const byCounterparty: Record<string, RfqQuote[]> = {};
  rfq.counterparty_quotes.forEach((q, idx) => {
    const key = String(q.counterparty_id ?? `cp-${q.counterparty_name ?? idx}`);
    if (!byCounterparty[key]) byCounterparty[key] = [];
    byCounterparty[key].push(q);
  });

  const entries: RankedEntry[] = Object.values(byCounterparty).map((quotes) => {
    const trades = groupTrades(quotes);
    let score = 0;
    let display = '';

    if (trades.length <= 1) {
      const price = trades[0]?.buyPrice ?? quotes[0]?.quote_price ?? 0;
      score = side === 'buy' ? -price : price;
      display = formatMoney(price);
    } else {
      const ordered = [...trades].sort((a, b) => {
        const aQuoted = a.quotedAt ?? Number.MAX_SAFE_INTEGER;
        const bQuoted = b.quotedAt ?? Number.MAX_SAFE_INTEGER;
        return aQuoted - bQuoted;
      });
      const first = ordered[0];
      const last = ordered[ordered.length - 1];
      const spread = (last?.buyPrice ?? 0) - (first?.buyPrice ?? 0);
      score = spread; // maior é melhor
      display = `Δ ${formatMoney(spread)}`;
    }

    const cp = quotes[0];
    return {
      counterparty_id: cp.counterparty_id,
      counterparty_name: cp.counterparty_name || 'Contraparte',
      score,
      display,
      trades,
    };
  });

  entries.sort((a, b) => {
    if (b.score !== a.score) return b.score - a.score;
    const atA = a.trades[0]?.quotedAt ?? Number.MAX_SAFE_INTEGER;
    const atB = b.trades[0]?.quotedAt ?? Number.MAX_SAFE_INTEGER;
    return atA - atB;
  });

  return { side, entries };
};
